package dev.authier.autofillfixture

import android.app.Activity
import android.os.Bundle
import android.text.InputType
import android.view.View
import android.view.autofill.AutofillManager
import android.webkit.WebView
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView

/** A separate, network-free app for exercising the real Android autofill framework with synthetic data. */
class AutofillFixtureActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(32, 100, 32, 32)
            importantForAutofill = View.IMPORTANT_FOR_AUTOFILL_YES
        }
        layout.addView(TextView(this).apply {
            text = "Authier autofill fixture\nDEVELOPMENT TEST APP\ndev.authier.autofillfixture"
            textSize = 20f
        })
        if (intent.getBooleanExtra("web", false)) {
            layout.addView(TextView(this).apply { text = "Synthetic HTTPS form. Only the system-selected fixture browser may assert this origin." })
            val web = WebView(this).apply {
                importantForAutofill = View.IMPORTANT_FOR_AUTOFILL_YES
                settings.javaScriptEnabled = true
                loadDataWithBaseURL("https://example.com", """<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><h2>Create a synthetic account</h2><form><p><input id="username" autocomplete="username" placeholder="Username" value="synthetic@example.test"></p><p><input id="current" type="password" autocomplete="current-password" value="synthetic-current-password"></p><p><input id="password" type="password" autocomplete="new-password" placeholder="New password"></p><p><input id="confirm" type="password" autocomplete="new-password" placeholder="Confirm password"></p></form></body></html>""", "text/html", "UTF-8", null)
            }
            layout.addView(web, LinearLayout.LayoutParams.MATCH_PARENT, 1000)
            val result = TextView(this)
            layout.addView(Button(this).apply {
                text = "Check generated web password"
                setOnClickListener {
                    web.evaluateJavascript("document.getElementById('password').value.length === 24 && document.getElementById('password').value === document.getElementById('confirm').value && document.getElementById('current').value === 'synthetic-current-password'") {
                        result.text = if (it == "true") "PASS: web passwords match; current password unchanged" else "FAIL: web values did not match"
                    }
                }
            })
            layout.addView(result)
            setContentView(layout)
            return
        }
        val signup = intent.getBooleanExtra("signup", false)
        val change = intent.getBooleanExtra("change", false)
        val currentPassword = EditText(this).apply {
            hint = "Current password — must stay unchanged"
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
            setAutofillHints("current-password")
            setText("synthetic-current-password")
        }
        if (change) layout.addView(currentPassword)
        val username = EditText(this).apply {
            id = View.generateViewId()
            hint = "Username"
            inputType = InputType.TYPE_CLASS_TEXT
            setAutofillHints(View.AUTOFILL_HINT_USERNAME)
            importantForAutofill = View.IMPORTANT_FOR_AUTOFILL_YES
        }
        val password = EditText(this).apply {
            id = View.generateViewId()
            hint = "Password"
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
            setAutofillHints(if (signup || change) "newPassword" else View.AUTOFILL_HINT_PASSWORD)
            importantForAutofill = View.IMPORTANT_FOR_AUTOFILL_YES
        }
        layout.addView(username)
        layout.addView(password)
        val confirmation = EditText(this).apply {
            hint = "Confirm new password"
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
            setAutofillHints("newPassword")
        }
        if (signup || change) layout.addView(confirmation)
        if (intent.getBooleanExtra("ambiguous", false)) layout.addView(EditText(this).apply {
            hint = "Second password — this form must be rejected"
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
            setAutofillHints(View.AUTOFILL_HINT_PASSWORD)
            importantForAutofill = View.IMPORTANT_FOR_AUTOFILL_YES
        })
        layout.addView(Button(this).apply {
            text = "Request autofill"
            setOnClickListener {
                password.requestFocus()
                getSystemService(AutofillManager::class.java).requestAutofill(password)
            }
        })
        val result = TextView(this).apply { textSize = 20f }
        layout.addView(Button(this).apply {
            text = "Check synthetic credentials"
            setOnClickListener {
                result.text = if (signup || change) {
                    if (password.text.length == 24 && password.text.toString() == confirmation.text.toString() &&
                        currentPassword.text.toString() == "synthetic-current-password") {
                        "PASS: generated password and confirmation match; current password unchanged"
                    } else "FAIL: generated fields did not match or current password changed"
                } else if (username.text.toString() == "autofill-demo" && password.text.toString() == "autofill-demo-password") {
                    "PASS: username and password filled correctly"
                } else "Not filled with the expected synthetic test values"
            }
        })
        layout.addView(result)
        setContentView(layout)
    }
}
