package com.authier;

import android.Manifest;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.provider.Settings;
import android.service.autofill.AutofillService;
import android.service.autofill.FillCallback;
import android.service.autofill.FillRequest;
import android.service.autofill.SaveCallback;
import android.service.autofill.SaveRequest;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;
import androidx.core.content.ContextCompat;

import com.authier.util.Helper;
import com.facebook.react.bridge.NativeModule;

import org.json.JSONArray;
import org.json.JSONException;

import java.util.List;
import java.util.SortedMap;
import java.util.TreeMap;

@RequiresApi(api = Build.VERSION_CODES.O)
public class MyAutofillService extends AutofillService implements NativeModule {
    private static String androidUri;
    private static JSONArray data;

    @RequiresApi(api = Build.VERSION_CODES.P)
    @Override
    public void onConnected() {
        super.onConnected();
        Log.e("OnConnected", "OnConnected");

        //TODO
        // SOlve here the problem with permission and then finish it!!!
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.PACKAGE_USAGE_STATS)
                != PackageManager.PERMISSION_GRANTED) {
            // Permission is not granted
            Log.e(TAG, "DENIED");
            Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
        }


        myPrefs = this.getSharedPreferences("myPrefs", MODE_PRIVATE);
        try {
            data = new JSONArray(myPrefs.getString("data", "[]"));
        } catch (JSONException e) {
            e.printStackTrace();
        }

        if (!Helper.isAppOnForeground((this))) {
            Intent intent = new Intent(this, HeadlessJs.class);
            Bundle bundle = new Bundle();

            //bundle.putString("foo", "bar");
            intent.putExtras(bundle);

            this.startService(intent);
        }

        sendEvent("onConnected", "true");

    }


    @Override
    public void onFillRequest(@NonNull FillRequest fillRequest, @NonNull CancellationSignal cancellationSignal, @NonNull FillCallback fillCallback) {

    }

    @Override
    public void onSaveRequest(@NonNull SaveRequest saveRequest, @NonNull SaveCallback saveCallback) {

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
