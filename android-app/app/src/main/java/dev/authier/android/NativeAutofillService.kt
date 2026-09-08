package dev.authier.android

import android.app.PendingIntent
import android.app.assist.AssistStructure
import android.content.Intent
import android.net.Uri
import android.os.CancellationSignal
import android.service.autofill.Dataset
import android.service.autofill.AutofillService
import android.service.autofill.FillCallback
import android.service.autofill.FillRequest
import android.service.autofill.FillResponse
import android.service.autofill.SaveCallback
import android.service.autofill.SaveRequest
import android.text.InputType
import android.view.View
import android.widget.RemoteViews
import java.util.UUID

/** Native app login forms only: no web origins, accessibility access, or plaintext persistence. */
class NativeAutofillService : AutofillService() {
    override fun onFillRequest(request: FillRequest, cancellationSignal: CancellationSignal, callback: FillCallback) {
        if (cancellationSignal.isCanceled) return
        val structure = request.fillContexts.lastOrNull()?.structure
        if (structure == null || structure.activityComponent.packageName == packageName) {
            callback.onSuccess(null)
            return
        }
        val nodes = collectNodes(structure)
        if (nodes == null) {
            callback.onSuccess(null)
            return
        }
        val requestedPackage = structure.activityComponent.packageName
        val selection = NativeAutofillTarget.select(requestedPackage, nodes.map(::metadata))
        if (selection == null || cancellationSignal.isCanceled) {
            callback.onSuccess(null)
            return
        }
        val passwordId = requireNotNull(nodes[selection.passwordIndex].autofillId)
        val usernameId = selection.usernameIndex?.let { nodes[it].autofillId }
        val intent = Intent(this, AutofillUnlockActivity::class.java)
            .setData(Uri.parse("authier-autofill:${UUID.randomUUID()}"))
            .putExtra(AutofillUnlockActivity.EXTRA_PACKAGE, requestedPackage)
            .putExtra(AutofillUnlockActivity.EXTRA_PASSWORD_ID, passwordId)
            .putExtra(AutofillUnlockActivity.EXTRA_USERNAME_ID, usernameId)
        // All targets originate in the system AssistStructure; callers cannot replace these extras.
        val authentication = PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_ONE_SHOT)
        val presentation = RemoteViews(packageName, android.R.layout.simple_list_item_1).apply {
            setTextViewText(android.R.id.text1, "Unlock Authier to fill this app")
        }
        // Dataset authentication fills immediately after our picker returns the selected login.
        val dataset = Dataset.Builder(presentation).setValue(passwordId, null)
            .setAuthentication(authentication.intentSender)
        usernameId?.let { dataset.setValue(it, null) }
        callback.onSuccess(FillResponse.Builder().addDataset(dataset.build()).build())
    }

    override fun onSaveRequest(request: SaveRequest, callback: SaveCallback) {
        callback.onFailure("Add or edit passwords in Authier. Automatic saving is not available yet.")
    }

    private fun collectNodes(structure: AssistStructure): List<AssistStructure.ViewNode>? {
        val pending = ArrayDeque<AssistStructure.ViewNode>()
        val nodes = mutableListOf<AssistStructure.ViewNode>()
        for (window in 0 until structure.windowNodeCount) pending.addLast(structure.getWindowNodeAt(window).rootViewNode)
        while (pending.isNotEmpty()) {
            if (nodes.size + pending.size > 5_000) return null
            val node = pending.removeFirst()
            nodes.add(node)
            for (index in 0 until node.childCount) pending.addLast(node.getChildAt(index))
        }
        return nodes
    }

    private fun metadata(node: AssistStructure.ViewNode): NativeAutofillNode {
        val variation = node.inputType and InputType.TYPE_MASK_VARIATION
        val text = node.inputType and InputType.TYPE_MASK_CLASS == InputType.TYPE_CLASS_TEXT
        return NativeAutofillNode(
            hints = node.autofillHints?.toList().orEmpty(),
            passwordInput = text && variation in listOf(InputType.TYPE_TEXT_VARIATION_PASSWORD, InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD),
            emailInput = text && variation == InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS,
            webContent = node.webDomain != null || node.htmlInfo != null || node.className.orEmpty().contains("webview", ignoreCase = true),
            hasAutofillId = node.autofillId != null,
            editable = node.autofillType == View.AUTOFILL_TYPE_TEXT,
        )
    }
}
