package com.authier;

import static android.view.autofill.AutofillManager.EXTRA_AUTHENTICATION_RESULT;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.IntentSender;
import android.os.Build;
import android.os.Bundle;
import android.os.Parcelable;
import android.service.autofill.Dataset;
import android.service.autofill.FillResponse;
import android.util.ArrayMap;
import android.util.Log;
import android.view.autofill.AutofillId;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;

import org.json.JSONException;


/**
 * Activity used for autofill authentication, it simply sets the dataste upon tapping OK.
 */
// TODO(b/114236837): should display a small dialog, not take the full screen
public class AuthActivity extends Activity {

    private static final String EXTRA_DATASET = "dataset";
    private static final String EXTRA_HINTS = "hints";
    private static final String EXTRA_IDS = "ids";
    private static final String EXTRA_AUTH_DATASETS = "auth_datasets";

    private static int sPendingIntentId = 0;

    @RequiresApi(api = Build.VERSION_CODES.P)
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.simple_service_auth_activity);
        findViewById(R.id.yes).setOnClickListener((view) -> {
            try {
                onYes();
            } catch (JSONException e) {
                e.printStackTrace();
            }
        });
        findViewById(R.id.no).setOnClickListener((view) -> onNo());
    }

    @RequiresApi(api = Build.VERSION_CODES.P)
    private void onYes() throws JSONException {
        Intent myIntent = getIntent();
        Intent replyIntent = new Intent();
        Dataset dataset = myIntent.getParcelableExtra(EXTRA_DATASET);
        if (dataset != null) {
            replyIntent.putExtra(EXTRA_AUTHENTICATION_RESULT, dataset);
        } else {
            String[] hints = myIntent.getStringArrayExtra(EXTRA_HINTS);
            Parcelable[] ids = myIntent.getParcelableArrayExtra(EXTRA_IDS);
            boolean authenticateDatasets = myIntent.getBooleanExtra(EXTRA_AUTH_DATASETS, false);
            int size = hints.length;
            ArrayMap<String, AutofillId> fields = new ArrayMap<>(size);
            for (int i = 0; i < size; i++) {
                fields.put(hints[i], (AutofillId) ids[i]);
            }
            FillResponse response =
                    AuthierAutofillService.createResponse(this, fields);
            replyIntent.putExtra(EXTRA_AUTHENTICATION_RESULT, response);

        }
        setResult(RESULT_OK, replyIntent);
        finish();
    }

    private void onNo() {
        setResult(RESULT_CANCELED);
        finish();
    }

    @RequiresApi(api = Build.VERSION_CODES.O)
    public static IntentSender newIntentSenderForDataset(@NonNull Context context,
                                                         @NonNull Dataset dataset) {
        return newIntentSender(context, dataset, null, null, false);
    }

    @RequiresApi(api = Build.VERSION_CODES.O)
    public static IntentSender newIntentSenderForResponse(@NonNull Context context,
                                                          @NonNull String[] hints, @NonNull AutofillId[] ids, boolean authenticateDatasets) {
        return newIntentSender(context, null, hints, ids, authenticateDatasets);
    }

    @RequiresApi(api = Build.VERSION_CODES.O)
    private static IntentSender newIntentSender(@NonNull Context context,
                                                @Nullable Dataset dataset, @Nullable String[] hints, @Nullable AutofillId[] ids,
                                                boolean authenticateDatasets) {
        Intent intent = new Intent(context, com.authier.AuthActivity.class);
        Log.e("TETS", "TEST");
        if (dataset != null) {
            intent.putExtra(EXTRA_DATASET, dataset);
        } else {
            intent.putExtra(EXTRA_HINTS, hints);
            intent.putExtra(EXTRA_IDS, ids);
            intent.putExtra(EXTRA_AUTH_DATASETS, authenticateDatasets);
        }

        return PendingIntent.getActivity(context, ++sPendingIntentId, intent,
                PendingIntent.FLAG_CANCEL_CURRENT).getIntentSender();
    }
}