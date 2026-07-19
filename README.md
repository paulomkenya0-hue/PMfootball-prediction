# ⚽ Utabiri wa Mechi — Android App

Programu ndogo ya Android (WebView + Firebase Firestore) inayokuruhusu wewe kama **msimamizi**
kuweka mechi za siku na utabiri wako (Over/Under, GG, Mashuti ya Kona, Ushindi 1X2), na
watumiaji wote waliosakinisha APK wanaona utabiri huo **moja kwa moja bila kusakinisha
toleo jipya** — kwa sababu data inatoka Firestore (wingu), si ndani ya APK.

> ⚠️ Hii ni programu ya **kutabiri/kutoa taarifa tu** — sio ya kubeti wala kukusanya pesa.

---

## 📦 Muundo wa mradi

```
UtabiriMechi/
├── app/
│   ├── build.gradle                     # usanidi wa module ya app
│   └── src/main/
│       ├── AndroidManifest.xml
│       ├── java/com/utabiri/mechi/MainActivity.kt   # WebView shell
│       ├── res/                          # icons, theme, layout
│       └── assets/www/                   # APP HALISI (HTML/CSS/JS)
│           ├── index.html
│           ├── style.css
│           ├── app.js                    # mantiki yote (Firestore, admin, public)
│           └── firebase-config.js        # WEKA FUNGUO ZAKO HAPA
├── build.gradle                          # usanidi wa project
├── settings.gradle
├── codemagic.yaml                        # usanidi wa Codemagic CI/CD
├── firestore.rules                       # sheria za Firestore (bandika Firebase Console)
└── README.md
```

Programu ni **WebView** rahisi (si Flutter), hivyo APK inabaki ndogo — kwa kawaida
**karibu 2–4 MB** kwa kila usanifu wa processor (ABI), tofauti na Flutter ambayo huanzia 15MB+.

---

## 1️⃣ Kuunganisha Firebase (lazima kwanza)

Data ya mechi inahifadhiwa Firestore ili kila mtu mwenye app aone mabadiliko yako papo hapo.

1. Nenda [console.firebase.google.com](https://console.firebase.google.com) → **Add project** → ipe jina (mf. `utabiri-mechi`) → maliza uundaji.
2. Ndani ya project: **Build → Firestore Database → Create database** → chagua **Start in production mode** → chagua eneo (mf. `eur3` au lolote karibu nawe) → **Enable**.
3. Bofya kicheko cha gia (⚙️) → **Project settings** → chini kwenye "Your apps" bofya alama ya **`</>`** (Web app) → ipe jina lolote → **Register app**.
4. Firebase itakuonyesha kitu kama hiki — **nakili maadili haya**:
   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "utabiri-mechi.firebaseapp.com",
     projectId: "utabiri-mechi",
     storageBucket: "utabiri-mechi.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123",
   };
   ```
5. Fungua faili **`app/src/main/assets/www/firebase-config.js`** kwenye mradi huu, badilisha
   maadili ya `firebaseConfig` na uliyopewa, na badilisha `ADMIN_PIN` kwa nambari yako ya siri.
6. Kwenye Firebase Console, nenda **Firestore Database → Rules**, futa yaliyopo, bandika
   maudhui ya faili `firestore.rules` iliyopo kwenye mradi huu, kisha **Publish**.

> 🔒 **Kuhusu usalama**: toleo hili linatumia PIN ndani ya programu tu (si Firebase
> Authentication), hivyo mtu mwenye ujuzi wa juu wa kiufundi anayejua `projectId` yako
> kinadharia angeweza kuandika Firestore moja kwa moja. Kwa matumizi madogo/binafsi hii
> inatosha. Ukitaka ulinzi imara zaidi baadaye, tuambie — tunaweza kuongeza Firebase
> Authentication (barua pepe/PIN ya kweli upande wa server).

---

## 2️⃣ Kupakia kwenye GitHub

```bash
cd UtabiriMechi
git init
git add .
git commit -m "Mradi wa awali - Utabiri wa Mechi"
git branch -M main
git remote add origin https://github.com/JINA_LAKO/utabiri-mechi.git
git push -u origin main
```

> Faili `.gitignore` tayari imewekwa kuzuia kupakia `build/`, `.gradle/`, na keystore zako.

---

## 3️⃣ Kuunganisha na Codemagic

1. Nenda [codemagic.io](https://codemagic.io) → **Sign up / Log in** kwa GitHub yako.
2. **Add application** → chagua repo ya `utabiri-mechi` → Codemagic itagundua ni **Android** app.
3. Codemagic itatambua faili **`codemagic.yaml`** iliyopo kwenye mzizi wa mradi na kutumia
   usanidi wake moja kwa moja (workflow `android-apk`).
4. Fungua `codemagic.yaml`, badilisha mstari wa email:
   ```yaml
   recipients:
     - WEKA_EMAIL_YAKO_HAPA@example.com
   ```
   kwa barua pepe yako halisi (utapata arifa APK ikiwa tayari), kisha `git commit` na `git push`.
5. Kwenye Codemagic, bofya **Start new build** ukichagua workflow `android-apk` na branch `main`.
6. Baada ya ~3-6 dakika, chini ya build utaona **Artifacts** → `app-debug.apk` (na
   `app-release-unsigned.apk`) — pakua moja kwa moja au ipokee kwa email.

### Kila mara unapo-`push` mabadiliko ya code kwenye GitHub
Codemagic itajenga APK mpya kiotomatiki (kwa sababu ya `triggering: events: push` kwenye
`codemagic.yaml`). **Lakini kumbuka:** mabadiliko ya **mechi na utabiri** (yaani kazi yako
ya kila siku kama msimamizi) **hayahitaji push wala build mpya** — yanaonekana papo hapo
kwa watumiaji kupitia Firestore mara tu unapoyaweka ndani ya programu yenyewe (bonyeza
"Msimamizi" ndani ya app iliyosakinishwa kwenye simu yako).

Utahitaji ku-push/build upya APK mpya tu ukibadilisha **design, PIN, au firebase-config**.

---

## 4️⃣ Kusaini APK (hiari, kwa kuchapisha rasmi)

APK ya `assembleRelease` bila keystore inatoka **"unsigned"** — inafanya kazi kwa
kusakinisha moja kwa moja (sideload) lakini si kwa Google Play. Ukitaka kuisaini:

1. Tengeneza keystore:
   ```bash
   keytool -genkey -v -keystore release.keystore -alias utabiri -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Kwenye Codemagic → App settings → **Environment variables**, unda group `keystore_credentials`
   na variables: `CM_KEYSTORE` (faili la keystore ulilopakia kama "file"), `CM_KEYSTORE_PASSWORD`,
   `CM_KEY_ALIAS`, `CM_KEY_PASSWORD`.
3. Ongeza `signingConfigs` kwenye `app/build.gradle` inayosoma variables hizo (tuambie
   ukifika hatua hii, tutakusaidia kuandika sehemu hiyo).

---

## 5️⃣ Kusakinisha APK kwenye simu

1. Pakua `app-debug.apk` kutoka kwa Codemagic (au barua pepe).
2. Kwenye simu ya Android: **Settings → Security → Install unknown apps** → ruhusu kwa
   browser/Files app unayotumia kufungua APK.
3. Fungua faili la APK, bofya **Install**.

---

## 🛠 Ukitaka kubadilisha kitu

| Unataka kubadilisha... | Fungua faili |
|---|---|
| Rangi, fonti, muonekano | `app/src/main/assets/www/style.css` |
| Masoko (markets), tabia ya app | `app/src/main/assets/www/app.js` |
| Muundo wa ukurasa/maandishi | `app/src/main/assets/www/index.html` |
| PIN ya msimamizi / funguo za Firebase | `app/src/main/assets/www/firebase-config.js` |
| Jina la app, ikoni | `app/src/main/res/values/strings.xml`, `res/mipmap-*`, `res/drawable/ic_launcher_*.xml` |
| Package name (`com.utabiri.mechi`) | `app/build.gradle` (`applicationId`) na `AndroidManifest.xml` |

---

## ❓ Matatizo ya kawaida

- **"Firebase bado haijawekwa" ndani ya app** → hujabadilisha `firebase-config.js`.
- **Mechi hazionekani kwa mtumiaji mwingine** → hakikisha wote wanatumia APK moja
  (Firebase project moja), na kwamba una intaneti (app inahitaji intaneti kila wakati
  kwani data haihifadhiwi kwenye simu).
- **Build inashindwa Codemagic na "SDK not found"** → hakikisha umechagua `instance_type`
  ya Linux/Mac inayokuja na Android SDK (default kwenye `codemagic.yaml` hii ni `linux_x2`
  ambayo ina Android SDK tayari).
- **APK kubwa kuliko unavyotarajia** → hakikisha huna maktaba za ziada zisizohitajika
  kwenye `app/build.gradle`; muundo wa sasa (WebView tu) unapaswa kubaki chini ya 5MB.

---

Ukiwa tayari kwa hatua inayofuata (kusaini APK kwa Play Store, kuongeza Firebase Auth
ya kweli, au matokeo/scoreboard ya usahihi wa utabiri wako), niambie.
