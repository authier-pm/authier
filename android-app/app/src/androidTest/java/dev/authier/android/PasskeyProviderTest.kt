package dev.authier.android

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.credentials.CreatePublicKeyCredentialRequest
import androidx.credentials.GetPublicKeyCredentialOption
import androidx.credentials.PublicKeyCredential
import androidx.credentials.provider.CallingAppInfo
import androidx.lifecycle.Lifecycle
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.platform.app.InstrumentationRegistry
import dev.authier.android.crypto.AuthierCrypto
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.*
import okhttp3.mockwebserver.Dispatcher
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import okhttp3.mockwebserver.RecordedRequest
import org.junit.*
import org.junit.Assert.*
import org.junit.Assume.assumeTrue
import java.io.File
import java.util.concurrent.TimeUnit
import javax.crypto.SecretKey

/** Framework request/result parcels with synthetic vault data; never contacts the production backend. */
class PasskeyProviderTest {
    @get:Rule val compose = createEmptyComposeRule()
    private val context: Context = ApplicationProvider.getApplicationContext()
    private val store by lazy { VaultStore(context) }
    private val server = MockWebServer()
    private var scenario: ActivityScenario<PasskeyActivity>? = null
    private lateinit var snapshot: VaultSnapshot
    private lateinit var key: SecretKey
    private lateinit var vector: JsonObject
    private val password = "synthetic-passkey-test-password"

    @Before fun setup() {
        assumeTrue(Build.VERSION.SDK_INT >= 34)
        check(store.read().email in listOf("", "synthetic@example.test")) { "Use a clean debug emulator." }
        vector = vaultJson.parseToJsonElement(InstrumentationRegistry.getInstrumentation().context.assets
            .open("passkeyInteropVectors.json").bufferedReader().use { it.readText() }).jsonObject.getValue("extension").jsonObject
        val salt = "AAECAwQFBgcICQoLDA0ODw=="
        key = AuthierCrypto.deriveMasterKey(password, salt)
        server.start()
        snapshot = store.update { VaultSnapshot(email = "synthetic@example.test", encryptionSalt = salt,
            authSecretEncrypted = AuthierCrypto.encrypt(key, "synthetic device secret", salt), serverUrl = server.url("/").toString(),
            sealedTokens = store.sealTokens(SessionTokens("synthetic-access", "synthetic-refresh")),
            secrets = listOf(SecretRecord("extension-passkey", AuthierCrypto.encrypt(key, vector.getValue("passkey").toString(), salt), "PASSKEY", 1, "2026-10-25T10:00:00Z"))) }
        VaultUnlockStore(context).clear()
    }

    @After fun cleanup() {
        scenario?.close()
        if (::snapshot.isInitialized) { VaultUnlockStore(context).clear(); store.clear() }
        server.shutdown()
    }

    private fun chromeInfo(origin: String = "https://login.example.com"): android.service.credentials.CallingAppInfo {
        val info = context.packageManager.getPackageInfo("com.android.chrome", PackageManager.GET_SIGNING_CERTIFICATES)
        return android.service.credentials.CallingAppInfo("com.android.chrome", requireNotNull(info.signingInfo), origin)
    }

    private fun launch(create: Boolean = false, account: String = snapshot.deviceId + ":" + snapshot.encryptionSalt) {
        val intent = Intent(context, PasskeyActivity::class.java).putExtra(PasskeyActivity.ACCOUNT, account)
        if (create) {
            val request = CreatePublicKeyCredentialRequest(vector.getValue("options").toString())
            intent.putExtra("android.service.credentials.extra.CREATE_CREDENTIAL_REQUEST",
                android.service.credentials.CreateCredentialRequest(chromeInfo(), request.type, request.credentialData))
        } else {
            val option = GetPublicKeyCredentialOption(vector.getValue("getOptions").toString())
            val request = android.service.credentials.BeginGetCredentialRequest.Builder().setCallingAppInfo(chromeInfo())
                .addBeginGetCredentialOption(android.service.credentials.BeginGetCredentialOption("option", option.type, option.candidateQueryData)).build()
            intent.putExtra("android.service.credentials.extra.BEGIN_GET_CREDENTIAL_REQUEST", request)
        }
        scenario = ActivityScenario.launchActivityForResult(intent)
    }

    private fun waitFor(text: String) {
        compose.waitUntil(10_000) { compose.onAllNodesWithText(text).fetchSemanticsNodes().isNotEmpty() }
    }

    private fun verify() {
        waitFor("Verify with master password")
        compose.onNodeWithText("Master password").performTextInput(password)
        compose.onNodeWithText("Verify with master password").performClick()
        waitFor("Identity verified")
    }

    private fun result(): android.app.Instrumentation.ActivityResult {
        val activity = requireNotNull(scenario)
        // Let Compose's test dispatcher process the asynchronous provider response before
        // blocking on the framework result callback.
        try { compose.waitUntil(10_000) { activity.state == Lifecycle.State.DESTROYED } }
        catch (failure: androidx.compose.ui.test.ComposeTimeoutException) { throw AssertionError(compose.onRoot().printToString(), failure) }
        return activity.result
    }

    private fun assertionResult(): JsonObject {
        val result = result()
        assertEquals(Activity.RESULT_OK, result.resultCode)
        val response = result.resultData.getParcelableExtra("android.service.credentials.extra.GET_CREDENTIAL_RESPONSE", android.credentials.GetCredentialResponse::class.java)
        val credential = androidx.credentials.Credential.createFrom(requireNotNull(response).credential.type, response.credential.data) as PublicKeyCredential
        return vaultJson.parseToJsonElement(credential.authenticationResponseJson).jsonObject
    }

    @Test fun extensionPasskeyRequiresVerificationAndReturnsFrameworkAssertion() {
        launch()
        waitFor("Verify with master password")
        compose.onNodeWithText("alex@example.com").assertDoesNotExist()
        compose.onNodeWithText("Master password").performTextInput("wrong password")
        compose.onNodeWithText("Verify with master password").performClick()
        waitFor("That master password could not unlock this vault.")
        verify()
        compose.onNodeWithText("Sign in").performClick()
        val json = assertionResult()
        assertEquals(vector.getValue("passkey").jsonObject["credentialId"], json["id"])
        assertEquals(vector.getValue("passkey").jsonObject["userHandle"], json.getValue("response").jsonObject["userHandle"])
        assertEquals(0, server.requestCount) // Existing credentials work with no Authier network request.
    }

    @Test fun unlockedVaultSignsInWithoutFreshVerificationOrExtendingTheUnlock() {
        VaultUnlockStore(context).remember(snapshot, key)
        val unlockFile = File(context.noBackupFilesDir, "vault-unlock.json")
        val savedUnlock = unlockFile.readText()
        launch()
        waitFor("Sign in")
        compose.onNodeWithText("Master password").assertDoesNotExist()
        compose.onNodeWithText("Verify with master password").assertDoesNotExist()
        compose.onNodeWithText("alex@example.com").assertExists()
        assertNotEquals(Lifecycle.State.DESTROYED, requireNotNull(scenario).state)
        assertEquals(savedUnlock, unlockFile.readText())
        compose.onNodeWithText("Sign in").performClick()
        val json = assertionResult()
        assertEquals(vector.getValue("passkey").jsonObject["credentialId"], json["id"])
        assertEquals(0, server.requestCount)
    }

    @Test fun expiredUnlockStillRequiresVerificationForSignIn() {
        val unlockStore = VaultUnlockStore(context)
        val now = unlockStore.now()
        val age = snapshot.lockTimeoutSeconds * 1000L + 1
        unlockStore.remember(snapshot, key, now.copy(wallTime = now.wallTime - age, elapsedTime = now.elapsedTime - age))
        launch()
        waitFor("Verify with master password")
        compose.onNodeWithText("alex@example.com").assertDoesNotExist()
        compose.onNodeWithText("Sign in").assertDoesNotExist()
    }

    @Test fun lockingTheVaultWhileChoosingAnAccountRequiresVerificationAgain() {
        val unlockStore = VaultUnlockStore(context)
        unlockStore.remember(snapshot, key)
        launch()
        waitFor("Sign in")
        unlockStore.clearSession()
        waitFor("Verify with master password")
        compose.onNodeWithText("alex@example.com").assertDoesNotExist()
        compose.onNodeWithText("Sign in").assertDoesNotExist()
        compose.onNodeWithText("Cancel").performScrollTo().performClick()
        assertEquals(Activity.RESULT_CANCELED, result().resultCode)
    }

    @Test fun creationStillRequiresFreshVerificationWithAnUnlockedVault() {
        VaultUnlockStore(context).remember(snapshot, key)
        launch(create = true)
        waitFor("Verify with master password")
        compose.onNodeWithText("Save passkey").assertDoesNotExist()
    }

    @Test fun cancellationDoesNotCreateOrReturnACredential() {
        launch(create = true)
        verify()
        compose.onNodeWithText("Cancel").performScrollTo().performClick()
        assertEquals(Activity.RESULT_CANCELED, result().resultCode)
        assertEquals(snapshot.secrets, store.read().secrets)
        assertTrue(store.read().outbox.isEmpty())
        assertEquals(0, server.requestCount)
    }

    @Test fun registrationWaitsForEncryptedServerWriteAndRetriesTheSameOperation() {
        var attempts = 0
        server.dispatcher = object : Dispatcher() {
            override fun dispatch(request: RecordedRequest): MockResponse {
                attempts++
                if (attempts == 1) return MockResponse().setResponseCode(503).setBody("""{"message":"Synthetic server unavailable"}""")
                val body = vaultJson.parseToJsonElement(request.body.clone().readUtf8()).jsonObject
                return MockResponse().setHeader("Content-Type", "application/json").setBody(buildJsonObject {
                    put("id", body.getValue("id")); put("encrypted", body.getValue("encrypted")); put("kind", "PASSKEY")
                    put("version", 1); put("createdAt", "2026-10-25T10:00:00Z"); put("updatedAt", JsonNull); put("deletedAt", JsonNull)
                }.toString())
            }
        }
        launch(create = true)
        verify()
        compose.onNodeWithText("Save passkey").performScrollTo().performClick()
        waitFor("Synthetic server unavailable")
        assertEquals(1, store.read().outbox.size)
        compose.onNodeWithText("Save passkey").performScrollTo().performClick()
        val result = result()
        assertEquals(Activity.RESULT_OK, result.resultCode)
        val first = requireNotNull(server.takeRequest(5, TimeUnit.SECONDS))
        val second = requireNotNull(server.takeRequest(5, TimeUnit.SECONDS))
        assertEquals("/api/v1/vault/create", first.path)
        assertEquals(first.body.readUtf8(), second.body.readUtf8())
        assertEquals(2, store.read().secrets.size)
        assertTrue(store.read().outbox.isEmpty())
        val created = readPasskeys(store.read(), key).single { it.record.id != "extension-passkey" }
        val response = result.resultData.getParcelableExtra("android.service.credentials.extra.CREATE_CREDENTIAL_RESPONSE", android.credentials.CreateCredentialResponse::class.java)
        val json = requireNotNull(requireNotNull(response).data.getString("androidx.credentials.BUNDLE_KEY_REGISTRATION_RESPONSE_JSON"))
        assertEquals(created.passkey.credentialId, vaultJson.parseToJsonElement(json).jsonObject.getValue("id").jsonPrimitive.content)
    }

    @Test fun changedAccountAndUntrustedOriginAreRejected() {
        launch(account = "different-account")
        waitFor("Your account changed. Open Authier, sync, and retry from the website.")
        compose.onNodeWithText("Verify with master password").assertDoesNotExist()
        val ownInfo = context.packageManager.getPackageInfo(context.packageName, PackageManager.GET_SIGNING_CERTIFICATES)
        val caller = CallingAppInfo(context.packageName, requireNotNull(ownInfo.signingInfo), "https://login.example.com")
        assertThrows(IllegalStateException::class.java) { PasskeyCallerTrust(context).verify(caller, "example.com", ByteArray(32)) }
        val native = CallingAppInfo(context.packageName, requireNotNull(ownInfo.signingInfo))
        assertThrows(IllegalArgumentException::class.java) { PasskeyCallerTrust(context).verify(native, "example.com", ByteArray(32)) }
    }

    @Test fun deletionWhileAccountPickerIsOpenPreventsSigning() {
        launch()
        verify()
        store.update { it.copy(secrets = emptyList()) }
        compose.onNodeWithText("Sign in").performClick()
        waitFor("This passkey changed. Cancel and choose it again.")
        compose.onNodeWithText("Cancel").performScrollTo().performClick()
        assertEquals(Activity.RESULT_CANCELED, result().resultCode)
    }
}
