package dev.authier.android

import kotlinx.serialization.encodeToString
import org.junit.Assert.*
import org.junit.Test

class VaultSyncTest {
    private fun record(id: String, encrypted: String = "ciphertext", deletedAt: String? = null) =
        SecretRecord(id, encrypted, "LOGIN_CREDENTIALS", 1, "2026-01-01T00:00:00Z", deletedAt = deletedAt)

    @Test fun appliesTombstonesAndCursorTogether() {
        val initial = VaultSnapshot(secrets = listOf(record("a"), record("b")), cursor = "old")
        val next = applySyncPage(initial, listOf(record("a", deletedAt = "2026-01-02T00:00:00Z"), record("c")), "new")
        assertEquals(setOf("b", "c"), next.secrets.filter { it.deletedAt == null }.map { it.id }.toSet())
        assertEquals("new", next.cursor)
        assertEquals("old", initial.cursor)
    }

    @Test fun preservesUnsentLocalEditWhileOtherDevicesSync() {
        val initial = VaultSnapshot(secrets = listOf(record("a", "local")), outbox = listOf(PendingWrite(operation = "update", id = "a", expectedVersion = 1)))
        val next = applySyncPage(initial, listOf(record("a", "remote")), "2")
        assertEquals("local", next.secrets.single().encrypted)
        assertEquals(initial.outbox.single().operationId, next.outbox.single().operationId)
    }

    @Test fun repeatedPageIsIdempotent() {
        val page = listOf(record("a"), record("b"))
        val first = applySyncPage(VaultSnapshot(), page, "2")
        assertEquals(first, applySyncPage(first, page, "2"))
    }

    @Test fun historicalPageCannotRollBackNewerSnapshotOrResurrectDeletion() {
        val newer = record("a", "latest").copy(version = 3)
        val tombstone = record("b", deletedAt = "2026-01-02T00:00:00Z").copy(version = 2)
        val next = applySyncPage(VaultSnapshot(secrets = listOf(newer, tombstone)), listOf(record("a", "old"), record("b")), "1")
        assertEquals(newer, next.secrets.find { it.id == "a" })
        assertEquals(tombstone, next.secrets.find { it.id == "b" })
    }

    @Test fun passkeysRemainOpaqueDuringMixedKindSyncAndSnapshotRoundTrip() {
        val passkey = record("passkey", "opaque-passkey-ciphertext").copy(kind = "PASSKEY")
        val login = record("login")
        val code = record("code").copy(kind = "TOTP")
        val next = applySyncPage(VaultSnapshot(), listOf(passkey, login, code), "3")
        val restored = vaultJson.decodeFromString<VaultSnapshot>(vaultJson.encodeToString(next))
        assertEquals(passkey, restored.secrets.find { it.id == passkey.id })
        assertEquals(listOf("login", "code"), restored.secrets.filter(::isVisibleInNativeVault).map { it.id })
        assertEquals("3", restored.cursor)
        val tombstone = passkey.copy(version = 2, deletedAt = "2026-09-08T10:00:00Z")
        val deleted = applySyncPage(restored, listOf(tombstone), "4")
        assertEquals(tombstone, deleted.secrets.find { it.id == passkey.id })
        assertEquals(tombstone, applySyncPage(deleted, listOf(passkey), "4").secrets.find { it.id == passkey.id })
    }

    @Test fun existingOpaquePasskeyOutboxIsPreservedWithoutReencodingItsPayload() {
        val local = record("passkey", "local-passkey-ciphertext").copy(kind = "PASSKEY")
        val write = PendingWrite(operation = "update", id = local.id, expectedVersion = 1, encrypted = local.encrypted, kind = local.kind)
        val snapshot = VaultSnapshot(secrets = listOf(local), outbox = listOf(write))
        val remote = local.copy(encrypted = "remote-passkey-ciphertext", version = 2)
        val next = applySyncPage(snapshot, listOf(remote), "2")
        val restored = vaultJson.decodeFromString<VaultSnapshot>(vaultJson.encodeToString(next))
        assertEquals(local, restored.secrets.single())
        assertEquals(write, restored.outbox.single())
        assertTrue(restored.secrets.filter(::isVisibleInNativeVault).isEmpty())
    }
}
