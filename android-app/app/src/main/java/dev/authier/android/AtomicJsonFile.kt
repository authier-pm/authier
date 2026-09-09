package dev.authier.android

import android.util.AtomicFile
import kotlinx.serialization.KSerializer
import java.io.File
import java.io.FileNotFoundException

/** Callers serialize access across read/modify/write operations. */
internal class AtomicJsonFile<T>(path: File, private val serializer: KSerializer<T>, private val empty: () -> T) {
    private val file = AtomicFile(path)

    fun read(): T = try {
        vaultJson.decodeFromString(serializer, file.openRead().bufferedReader().use { it.readText() })
    } catch (error: FileNotFoundException) {
        if (file.baseFile.exists() || File(file.baseFile.path + ".bak").exists()) throw error
        empty()
    }

    fun write(value: T) {
        val stream = file.startWrite()
        // Roll back interrupted writes without losing the previous complete state.
        try {
            stream.write(vaultJson.encodeToString(serializer, value).toByteArray())
            file.finishWrite(stream)
        } catch (error: Exception) {
            file.failWrite(stream)
            throw error
        }
    }

    fun delete() = file.delete()
}
