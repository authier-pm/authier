package dev.authier.android

import android.app.PendingIntent
import android.app.assist.AssistStructure
import android.content.Intent
import android.net.Uri
import android.os.Build
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

class NativeAutofillService : AutofillService() {
    override fun onFillRequest(request: FillRequest, cancellationSignal: CancellationSignal, callback: FillCallback) {
        if (cancellationSignal.isCanceled) return
        val structure = request.fillContexts.lastOrNull()?.structure
        if (structure == null || structure.activityComponent.packageName == packageName) {
            callback.onSuccess(null)
            return
        }
        val fields = collectNodes(structure)
        val requestedPackage = structure.activityComponent.packageName
        val selection = fields?.let { NativeAutofillTarget.select(requestedPackage, it.map { field -> field.metadata }) }
        if (selection == null || cancellationSignal.isCanceled) {
            callback.onSuccess(null)
            return
        }
        val username = selection.usernameIndex?.let { fields[it].node }
        val passwordId = selection.passwordIndex?.let { fields[it].node.autofillId }
        val generationIds = ArrayList(selection.generatedPasswordIndices.map { requireNotNull(fields[it].node.autofillId) })
        val response = FillResponse.Builder()
        fun offer(create: Boolean, label: String) {
            val intent = Intent(this, AutofillUnlockActivity::class.java)
                .setData(Uri.parse("authier-autofill:${UUID.randomUUID()}"))
                .putExtra(AutofillUnlockActivity.EXTRA_PACKAGE, requestedPackage)
                .putExtra(AutofillUnlockActivity.EXTRA_ORIGIN, selection.webOrigin)
                .putExtra(AutofillUnlockActivity.EXTRA_PASSWORD_ID, passwordId)
                .putExtra(AutofillUnlockActivity.EXTRA_USERNAME_ID, username?.autofillId)
                .putExtra(AutofillUnlockActivity.EXTRA_USERNAME, username?.autofillValue?.takeIf { it.isText }?.textValue?.toString().orEmpty().take(320))
                .putParcelableArrayListExtra(AutofillUnlockActivity.EXTRA_GENERATION_IDS, generationIds)
                .putExtra(AutofillUnlockActivity.EXTRA_CREATE, create)
            val authentication = PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_ONE_SHOT)
            val presentation = RemoteViews(packageName, android.R.layout.simple_list_item_1).apply {
                setTextViewText(android.R.id.text1, label)
            }
            val dataset = Dataset.Builder(presentation).setAuthentication(authentication.intentSender)
            val targets = if (create) generationIds else listOf(requireNotNull(passwordId))
            targets.forEach { dataset.setValue(it, null) }
            username?.autofillId?.let { dataset.setValue(it, null) }
            response.addDataset(dataset.build())
        }
        if (passwordId != null) offer(false, "Fill a saved login with Authier")
        if (generationIds.isNotEmpty()) offer(true, "Create a strong password with Authier")
        callback.onSuccess(response.build())
    }

    override fun onSaveRequest(request: SaveRequest, callback: SaveCallback) {
        callback.onFailure("Use Save and fill in Authier to save a generated login. Automatic form saving is not available yet.")
    }

    private data class Field(val node: AssistStructure.ViewNode, val metadata: NativeAutofillNode)
    private data class PendingNode(val node: AssistStructure.ViewNode, val origin: String?, val web: Boolean, val visible: Boolean)

    private fun collectNodes(structure: AssistStructure): List<Field>? {
        val pending = ArrayDeque<PendingNode>()
        val fields = mutableListOf<Field>()
        for (window in 0 until structure.windowNodeCount) {
            pending.addLast(PendingNode(structure.getWindowNodeAt(window).rootViewNode, null, false, true))
        }
        while (pending.isNotEmpty()) {
            if (fields.size + pending.size > 5_000) return null
            val parent = pending.removeFirst()
            val node = parent.node
            val domain = node.webDomain?.takeIf { it.isNotBlank() }
            val web = parent.web || domain != null || node.htmlInfo != null || node.className.orEmpty().contains("webview", ignoreCase = true)
            val origin = if (domain != null) {
                val scheme = if (Build.VERSION.SDK_INT >= 28) node.webScheme else null
                // A missing scheme cannot establish an HTTPS origin.
                if (scheme != "https") return null
                httpsOrigin("$scheme://$domain") ?: return null
            } else parent.origin
            val visible = parent.visible && node.visibility == View.VISIBLE
            fields.add(Field(node, metadata(node, web, origin, visible)))
            for (index in 0 until node.childCount) pending.addLast(PendingNode(node.getChildAt(index), origin, web, visible))
        }
        return fields
    }

    private fun metadata(node: AssistStructure.ViewNode, web: Boolean, origin: String?, visible: Boolean): NativeAutofillNode {
        val variation = node.inputType and InputType.TYPE_MASK_VARIATION
        val text = node.inputType and InputType.TYPE_MASK_CLASS == InputType.TYPE_CLASS_TEXT
        val html = node.htmlInfo?.attributes.orEmpty().associate { it.first.lowercase() to it.second.lowercase() }
        val hints = node.autofillHints?.toList().orEmpty() + html["autocomplete"].orEmpty().split(Regex("\\s+"))
        return NativeAutofillNode(
            hints = hints,
            passwordInput = html["type"] == "password" || text && variation in listOf(InputType.TYPE_TEXT_VARIATION_PASSWORD, InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD, InputType.TYPE_TEXT_VARIATION_WEB_PASSWORD),
            emailInput = html["type"] == "email" || text && variation in listOf(InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS, InputType.TYPE_TEXT_VARIATION_WEB_EMAIL_ADDRESS),
            webContent = web,
            webOrigin = origin,
            hasAutofillId = node.autofillId != null,
            editable = node.autofillType == View.AUTOFILL_TYPE_TEXT,
            focused = node.isFocused,
            visible = visible,
        )
    }
}
