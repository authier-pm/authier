package com.authier;

import static android.content.Context.MODE_PRIVATE;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;

import com.authier.util.Helper;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

import org.json.JSONArray;

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

    @Override
    public String getName() {
        return "AutofillModule";
    }
}