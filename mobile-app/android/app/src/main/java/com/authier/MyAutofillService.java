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
import android.service.autofill.Dataset;
import android.service.autofill.FillCallback;
import android.service.autofill.FillContext;
import android.service.autofill.FillRequest;
import android.service.autofill.FillResponse;
import android.service.autofill.SaveCallback;
import android.service.autofill.SaveInfo;
import android.service.autofill.SaveRequest;
import android.util.ArrayMap;
import android.util.Log;
import android.view.autofill.AutofillId;
import android.view.autofill.AutofillValue;
import android.widget.RemoteViews;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;

import com.authier.util.Helper;
import com.facebook.react.bridge.NativeModule;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Collection;
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
    private int nodeCount = 1;


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


    @RequiresApi(api = Build.VERSION_CODES.P)
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
        // Get the structure from the request
        List<FillContext> context = saveRequest.getFillContexts();

        AssistStructure structure = context.get(context.size() - 1).getStructure();

        Object fields = null;
        try {
            fields = getSavaFields(structure);
        } catch (JSONException e) {
            e.printStackTrace();
        }

        data.put(fields);
        Log.e("OnSaveRequest", data.toString());

        SharedPreferences.Editor e = myPrefs.edit();
        e.putString("data", data.toString());
        e.apply();

        Helper.sendEvent("pswSaved", data.toString(), sApplication);

        // Persist the data, if there are no errors, call onSuccess()
        saveCallback.onSuccess();
    }

    @NonNull
    private Object getSavaFields(@NonNull AssistStructure structure) throws JSONException {
        JSONObject jsonObj= new JSONObject();

        int nodes = structure.getWindowNodeCount();
        for (int i = 0; i < nodes; i++) {
            AssistStructure.ViewNode node = structure.getWindowNodeAt(i).getRootViewNode();
            addFieldsToSave(node, jsonObj);
        }

        return jsonObj;
    }

    private void addFieldsToSave(@NonNull AssistStructure.ViewNode node, JSONObject obj) throws JSONException {
        String androidUriToSave;
        String hint = Helper.getHint(node);

        if (hint != null) {

            androidUriToSave = Helper.retriveNewApp(sApplication);

            obj.put("androidUri", androidUriToSave);
            if(nodeCount == 1) {
                obj.put("usernameHint", hint);
                obj.put("username", node.getText());
            } else if(nodeCount == 2){
                obj.put("passwordHint", hint);
                obj.put("password", node.getText());
            }

            nodeCount = nodeCount + 1;
        }


        int childrenSize = node.getChildCount();
        for (int i = 0; i < childrenSize; i++) {
            addFieldsToSave( node.getChildAt(i), obj);
        }
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

    @RequiresApi(api = Build.VERSION_CODES.P)
    static FillResponse createResponse(@NonNull Context context,
                                       @NonNull ArrayMap<String, AutofillId> fields) throws JSONException {

        String packageName = context.getPackageName();
        FillResponse.Builder response = new FillResponse.Builder();

        if(data != null) {
            for (int i = 0; i < data.length(); i++) {
                JSONObject item = data.getJSONObject(i);
                if(item.getString("androidUri").equals(androidUri)) {
                    Dataset unlockedDataset = fieldDataset(fields, packageName, item);
                    response.addDataset(unlockedDataset);
                }
            }
        }

        Collection<AutofillId> ids = fields.values();
        AutofillId[] requiredIds = new AutofillId[ids.size()];
        ids.toArray(requiredIds);
        response.setSaveInfo(
                // We're simple, so we're generic
                new SaveInfo.Builder(SaveInfo.SAVE_DATA_TYPE_USERNAME | SaveInfo.SAVE_DATA_TYPE_PASSWORD, requiredIds).setFlags(SaveInfo.FLAG_SAVE_ON_ALL_VIEWS_INVISIBLE).build());


        // 3.Profit!
        return response.build();
    }

    static Dataset fieldDataset(@NonNull Map<String, AutofillId> fields,
                                @NonNull String packageName, JSONObject item) throws JSONException {
        Dataset.Builder dataset = new Dataset.Builder();

        for (Map.Entry<String, AutofillId> field : fields.entrySet()) {
            String hint = field.getKey();
            AutofillId id = field.getValue();

            RemoteViews presentation = newDatasetPresentation(packageName, item.getString("username"));

            if(hint.equals(item.getString("usernameHint"))) {

                dataset.setValue(id, AutofillValue.forText(item.getString("username")), presentation);
            } else if(hint.equals(item.getString("passwordHint"))) {

                dataset.setValue(id, AutofillValue.forText(item.getString("password")), presentation);
            }

        }

        return dataset.build();
    }

    /**
     * Helper method to create a dataset presentation with the given text.
     */
    @NonNull
    static RemoteViews newDatasetPresentation(@NonNull String packageName,
                                              @NonNull CharSequence text) {
        RemoteViews presentation =
                new RemoteViews(packageName, R.layout.multidataset_service_list_item);
        presentation.setTextViewText(R.id.text, text);
        presentation.setImageViewResource(R.id.icon, R.mipmap.ic_launcher);
        return presentation;
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




}
