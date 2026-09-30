package dev.authier.android

/** Another component replaced the saved session while a background request ran. */
class SavedSessionChanged : IllegalStateException("The saved session changed. Retry later.")

/**
 * Runs [block] with the saved server session outside the UI, refreshing an expired
 * access token once. Returns null when this phone is signed out. Background work uses
 * this without the vault key: requests carry tokens and ciphertext only.
 */
suspend fun <T> withSavedSession(store: VaultStore, block: suspend (ApiFacade) -> T): T? {
    val snapshot = store.read()
    val tokens = store.openTokens(snapshot.sealedTokens) ?: return null
    val api = ApiFacade(snapshot.serverUrl, snapshot.deviceId).apply { accessToken = tokens.accessToken }
    return try {
        block(api)
    } catch (error: ApiFailure) {
        if (error.status != 401) throw error
        val refreshed = api.refresh(tokens.refreshToken)
        val sealed = store.sealTokens(refreshed)
        // Merge only token changes. Never restore a logged-out account or overwrite
        // ciphertext/outbox writes that happened while the request was in flight.
        val current = store.update { latest ->
            if (latest.deviceId == snapshot.deviceId && latest.serverUrl == snapshot.serverUrl &&
                latest.email == snapshot.email && latest.sealedTokens == snapshot.sealedTokens)
                latest.copy(sealedTokens = sealed)
            else latest
        }
        if (current.sealedTokens != sealed) throw SavedSessionChanged()
        api.accessToken = refreshed.accessToken
        block(api)
    } finally {
        api.accessToken = null
    }
}
