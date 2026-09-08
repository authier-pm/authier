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
            layout.addView(TextView(this).apply { text = "Web content must receive no Authier suggestion." })
            layout.addView(WebView(this).apply {
                importantForAutofill = View.IMPORTANT_FOR_AUTOFILL_YES
                loadDataWithBaseURL("https://example.com", """<html><body><h2>Web login must be rejected</h2><form><input name="username" autocomplete="username" placeholder="Web username"><input type="password" name="password" autocomplete="current-password" placeholder="Web password"></form></body></html>""", "text/html", "UTF-8", null)
            }, LinearLayout.LayoutParams.MATCH_PARENT, 700)
            setContentView(layout)
            return
        }
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
            setAutofillHints(View.AUTOFILL_HINT_PASSWORD)
            importantForAutofill = View.IMPORTANT_FOR_AUTOFILL_YES
        }
        layout.addView(username)
        layout.addView(password)
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
                result.text = if (username.text.toString() == "autofill-demo" && password.text.toString() == "autofill-demo-password") {
                    "PASS: username and password filled correctly"
                } else "Not filled with the expected synthetic test values"
            }
        })
        layout.addView(result)
        setContentView(layout)
    }
}
