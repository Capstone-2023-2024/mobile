import {ONE_SIGNAL_APP_ID, WEB_CLIENT_ID} from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import React, {createContext, useContext, useEffect, useState} from 'react';
import {LogLevel, OneSignal} from 'react-native-onesignal';
import Loading from '~/components/SplashScreen';
import {Role} from '~/screens/authentication/Landing/types';
import {CURRENT_STUDENT_KEY} from '~/utils/config';
import {collectionRef} from '~/utils/firebase';
import type {
  AuthContextType,
  AuthProviderProps,
  InitialStateProps,
  LoginMessagePrompt,
} from './types';

const initialState: InitialStateProps = {
  currentUser: null,
  isLoading: true,
};
const AuthContext = createContext<AuthContextType>({
  ...initialState,
  signout: async () => {},
  onGoogleButtonPress: async () => null,
});

const config = {
  webClientId: WEB_CLIENT_ID,
};

const AuthProvider = ({children}: AuthProviderProps) => {
  GoogleSignin.configure({...config});
  const [state, setState] = useState(initialState);

  async function signout() {
    try {
      await auth().signOut();
      await GoogleSignin.revokeAccess();
      await AsyncStorage.removeItem(CURRENT_STUDENT_KEY);
      const cachedRole = (await AsyncStorage.getItem('role')) as Role;
      if (cachedRole === 'adviser') {
        AsyncStorage.setItem('role', 'faculty');
      } else if (cachedRole === 'mayor') {
        AsyncStorage.setItem('role', 'student');
      }
    } catch (err) {
      // console.log(err)
      return;
    }
  }
  async function onGoogleButtonPress(): Promise<LoginMessagePrompt> {
    try {
      await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
      const {idToken} = await GoogleSignin.signIn();
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const {additionalUserInfo} = await auth().signInWithCredential(
        googleCredential,
      );

      const role = await AsyncStorage.getItem('role');
      const profile = additionalUserInfo?.profile;
      const student = role === 'mayor' || role === 'student';
      const collectionReference = student
        ? collectionRef('student').where('email', '==', profile?.email)
        : collectionRef('permission')
            .where('email', '==', profile?.email)
            .where('roleInString', '==', 'faculty');
      const snapshotCount = await collectionReference.count().get();
      const count = snapshotCount.data().count;
      if (count === 0) {
        await signout();
        return student ? 'COR_UNREGISTERED' : 'FACULTY_PERMISSION_NULL';
      }
      const src = additionalUserInfo?.profile?.picture;
      const snapshot = await collectionReference.get();
      const result = snapshot.docs[0];
      collectionRef(student ? 'student' : 'permission')
        .doc(result?.id)
        .update({src});
      return 'SUCCESS';
    } catch (err) {
      // console.log(err);
      return 'ERROR';
    }
  }

  useEffect(
    () =>
      auth().onAuthStateChanged(user => {
        if (user !== null && user.email !== null) {
          OneSignal.initialize(ONE_SIGNAL_APP_ID);
          OneSignal.Debug.setLogLevel(LogLevel.Verbose);
          OneSignal.Notifications.requestPermission(true);
          OneSignal.Notifications.addEventListener('click', event => {
            console.log('OneSignal: notification clicked:', event);
          });
          OneSignal.login(user.email);
        }

        setState(prevState => ({
          ...prevState,
          currentUser: user,
          isLoading: false,
        }));
      }),
    [],
  );

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signout,
        onGoogleButtonPress,
      }}>
      {state.isLoading ? <Loading /> : children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
export const useAuth = () => useContext(AuthContext);
