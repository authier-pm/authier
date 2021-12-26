package com.authier;

import static android.content.Context.MODE_PRIVATE;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;

import androidx.annotation.RequiresApi;

import com.authier.util.Helper;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;

import org.json.JSONArray;
import org.json.JSONException;

public class AutofillModule extends ReactContextBaseJavaModule {
    private static JSONArray mReadableArray;
    private static ReactApplicationContext reactContext;
    private SharedPreferences myPrefs;


    AutofillModule(ReactApplicationContext context) {
        super(context);

        if (!Helper.isAppOnForeground((this.getReactApplicationContext()))) {
            Intent intent = new Intent(this.getReactApplicationContext(), HeadlessJs.class);
            Bundle bundle = new Bundle();

            intent.putExtras(bundle);

            this.getReactApplicationContext().startService(intent);
        }

        myPrefs = context.getSharedPreferences("myPrefs", MODE_PRIVATE);
    }

    @RequiresApi(api = Build.VERSION_CODES.O)
    @ReactMethod
    public void sendData(ReadableArray readableArray) throws JSONException {
        Log.e("sendedData", readableArray.toString());
        if(readableArray.size() > 0) {
            mReadableArray = Helper.convertArrayToJson(readableArray);
            SharedPreferences.Editor e = myPrefs.edit();
            e.putString("data", readableArray.toString()); // add or overwrite someValue
            e.apply(); // this saves to disk and notifies observers
        }

    }

    @Override
    public String getName() {
        return "AutofillModule";
    }
}