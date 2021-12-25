package com.authier;

import static android.app.AppOpsManager.OPSTR_GET_USAGE_STATS;
import static android.os.Process.myUid;

import android.app.AppOpsManager;
import android.app.assist.AssistStructure;
import android.content.Context;
import android.content.Intent;
import android.content.IntentSender;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.provider.Settings;
import android.service.autofill.AutofillService;
import android.service.autofill.FillCallback;
import android.service.autofill.FillContext;
import android.service.autofill.FillRequest;
import android.service.autofill.FillResponse;
import android.service.autofill.SaveCallback;
import android.service.autofill.SaveRequest;
import android.util.ArrayMap;
import android.util.Log;
import android.view.autofill.AutofillId;
import android.widget.RemoteViews;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;

import com.authier.util.Helper;
import com.facebook.react.bridge.NativeModule;

import org.json.JSONArray;
import org.json.JSONException;

import java.util.List;
import java.util.Map;


@RequiresApi(api = Build.VERSION_CODES.O)
public class MyAutofillService extends AutofillService implements NativeModule {

    private static String androidUri;
    private static JSONArray data;
    private SharedPreferences myPrefs;
    private static MainApplication sApplication;
    private boolean mAuthenticateResponses;
    private boolean mAuthenticateDatasets;


    @Override
    public void onCreate() {
        super.onCreate();
        sApplication = (MainApplication) this.getApplication();
    }

    @RequiresApi(api = Build.VERSION_CODES.P)
    @Override
    public void onConnected() {
        super.onConnected();

        mAuthenticateResponses = false;
        mAuthenticateDatasets = false;

        AppOpsManager appOps = (AppOpsManager) this.getApplicationContext().getSystemService(Context.APP_OPS_SERVICE);
        int mode = appOps.checkOpNoThrow(OPSTR_GET_USAGE_STATS, myUid(), this.getApplicationContext().getPackageName());

        if(mode != 0) {
            Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
        }

        //init shared storage
        myPrefs = this.getSharedPreferences("myPrefs", MODE_PRIVATE);
        try {
            data = new JSONArray(myPrefs.getString("data", "[]"));
        } catch (JSONException e) {
            e.printStackTrace();
        }

        if (!Helper.isAppOnForeground((this))) {
            Intent intent = new Intent(this, HeadlessJs.class);
            Bundle bundle = new Bundle();

            intent.putExtras(bundle);
            this.startService(intent);
        }

        Helper.sendEvent("onConnected", "true", sApplication);

    }


    @Override
    public void onFillRequest(@NonNull FillRequest request, @NonNull CancellationSignal cancellationSignal, @NonNull FillCallback fillCallback) {
        //For now we are using sharedPreferences it is not ideal, we should at least encrypt it
        // Find autofillable fields
        AssistStructure structure = getLatestAssistStructure(request);
        ArrayMap<String, AutofillId> fields = getAutofillableFields(structure);

        if (fields.isEmpty()) {
            toast("No autofill hints found");
            fillCallback.onSuccess(null);
            return;
        }

        // Create response...
        FillResponse response;
        if (mAuthenticateResponses) {
            int size = fields.size();
            String[] hints = new String[size];
            AutofillId[] ids = new AutofillId[size];
            for (int i = 0; i < size; i++) {
                hints[i] = fields.keyAt(i);
                ids[i] = fields.valueAt(i);
            }

            IntentSender authentication = AuthActivity.newIntentSenderForResponse(this, hints,
                    ids, mAuthenticateDatasets);
            RemoteViews presentation = newDatasetPresentation(getPackageName(),
                    "Tap to auth response");

            response = new FillResponse.Builder()
                    .setAuthentication(ids, authentication, presentation).build();
        } else {
            try {
                response = createResponse(this, fields);
            } catch (JSONException e) {
                response = null;
                e.printStackTrace();
            }
        }

        // ... and return it
        fillCallback.onSuccess(response);
    }

    @Override
    public void onSaveRequest(@NonNull SaveRequest saveRequest, @NonNull SaveCallback saveCallback) {

    }

    /**
     * Parses the {@link AssistStructure} representing the activity being autofilled, and returns a
     * map of autofillable fields (represented by their autofill ids) mapped by the hint associate
     * with them.
     *
     * <p>An autofillable field is a {@link AssistStructure.ViewNode} whose {@link //#getHint(AssistStructure.ViewNode)} metho
     * @return
     */
    @NonNull
    private ArrayMap<String, AutofillId> getAutofillableFields(@NonNull AssistStructure structure) {
        ArrayMap<String, AutofillId> fields = new ArrayMap<>();

        int nodes = structure.getWindowNodeCount();
        for (int i = 0; i < nodes; i++) {
            AssistStructure.ViewNode node = structure.getWindowNodeAt(i).getRootViewNode();
            addAutofillableFields(fields, node);

        }

        return fields;
    }

    /**
     * Adds any autofillable view from the {@link AssistStructure.ViewNode} and its descendants to the map.
     */

    private void addAutofillableFields(@NonNull Map<String, AutofillId> fields,
                                       @NonNull AssistStructure.ViewNode node) {
        String hint = Helper.getHint(node);

        if (hint != null) {
            AutofillId id = node.getAutofillId();

            androidUri = Helper.retriveNewApp(this.getApplicationContext());

            if (!fields.containsKey(hint)) {
                fields.put(hint, id);
            }

        }

        int childrenSize = node.getChildCount();
        for (int i = 0; i < childrenSize; i++) {
            addAutofillableFields(fields, node.getChildAt(i));
        }
    }

    @NonNull
    @Override
    public String getName() {
        return "MyAutofillService";
    }

    @Override
    public void initialize() {

    }

    @Override
    public boolean canOverrideExistingModule() {
        return false;
    }

    @Override
    public void onCatalystInstanceDestroy() {

    }

    /**
     * Displays a toast with the given message.
     */
    private void toast(@NonNull CharSequence message) {
        Toast.makeText(getApplicationContext(), message, Toast.LENGTH_LONG).show();
    }

    /**
     * Helper method to get the {@link AssistStructure} associated with the latest request
     * in an autofill context.
     */
    @NonNull
    static AssistStructure getLatestAssistStructure(@NonNull FillRequest request) {
        List<FillContext> fillContexts = request.getFillContexts();
        return fillContexts.get(fillContexts.size() - 1).getStructure();
    }


}
