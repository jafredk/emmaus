# Emmaus Healthcare Dashboard

Next.js application for healthcare staff workflows (reception, doctor, lab, pharmacy, and admin).

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` in the project root.

3. Add Firebase Client SDK values (required for real Firebase login):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

4. Add Firebase Admin SDK values (required for real server session cookies):

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

5. Run the development server:

```bash
npm run dev
```

Open http://localhost:3000.

## Firebase Roles

This app uses Firebase Auth custom claims for role-based access.

Set the `role` claim to one of:

- `ADMINISTRATOR`
- `RECEPTIONIST`
- `DOCTOR`
- `LAB_TECHNICIAN`
- `PHARMACIST`

Example Admin SDK script:

```js
import admin from "firebase-admin";

admin.initializeApp({
	credential: admin.credential.applicationDefault(),
});

await admin.auth().setCustomUserClaims("USER_UID_HERE", {
	role: "RECEPTIONIST",
});
```

After setting claims, the user should sign out and back in so the new role appears in the ID token.

### Suggested Role Mapping For Current Staff Accounts

- `admin.jafredjin@gmail.com` -> `ADMINISTRATOR`
- `jafredkipjin@gmail.com` -> `RECEPTIONIST`
- `doctor.jafredkipjin@gmail.com` -> `DOCTOR`

Permissions expected in app:

- `ADMINISTRATOR`: can add, view, edit, and delete patients
- `RECEPTIONIST`: can add and view patients, but cannot edit or delete
- `DOCTOR`: cannot access receptionist patient management pages unless explicitly granted in rules and route guards

## Firestore Rules

The repo now includes [firestore.rules](firestore.rules) and [firebase.json](firebase.json).

Deploy them with:

```bash
npx firebase-tools deploy --only firestore:rules --project emmaus-f598c
```

Patient writes are allowed only when the authenticated user has the `RECEPTIONIST` or `ADMINISTRATOR` custom claim.

## Admin Claims API

You can assign Firebase custom role claims from inside this app using:

- `POST /api/admin/claims`

Security:

- Requires a valid authenticated session cookie
- Caller must have `ADMINISTRATOR` role
- Uses Firebase Admin SDK on the server

Request body:

```json
{
	"email": "jafredkipjin@gmail.com",
	"role": "RECEPTIONIST"
}
```

Allowed roles:

- `ADMINISTRATOR`
- `RECEPTIONIST`
- `DOCTOR`
- `LAB_TECHNICIAN`
- `PHARMACIST`

Example using curl:

```bash
curl -X POST http://localhost:3000/api/admin/claims \
	-H "Content-Type: application/json" \
	-H "Cookie: session=YOUR_SESSION_COOKIE" \
	-d '{"email":"doctor.jafredkipjin@gmail.com","role":"DOCTOR"}'
```

After claim changes, the target user must sign out and sign in again.

## Admin Create User API

You can create staff Firebase Auth users from inside the app using:

- `POST /api/admin/users`

Security:

- Requires a valid authenticated session cookie
- Caller must have `ADMINISTRATOR` role
- Uses Firebase Admin SDK on the server

Request body:

```json
{
	"displayName": "Doctor Jafred",
	"email": "doctor.jafredkipjin@gmail.com",
	"password": "Password1",
	"role": "DOCTOR"
}
```

Result:

- Creates the Firebase Auth user
- Assigns the selected custom role claim
- New user can sign in immediately
