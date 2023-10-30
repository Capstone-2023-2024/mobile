import React, {useEffect, useState} from 'react';
import {
  Alert,
  ScrollView,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import {Text} from '~/components';
import Background from '~/components/Background';
import FooterNav from '~/components/FooterNav';
import {Announcements, CalendarOfActivities, Usertab} from '~/components/Home';
import {useAuth} from '~/contexts/AuthContext';
import {useContent} from '~/contexts/ContentContext';
import {useNav} from '~/contexts/NavigationContext';
import type {StudentCORProps} from '~/types/student';
import {collectionRef} from '~/utils/firebase';

const Home = () => {
  const {handleNavigation} = useNav();
  const {role, handleUsersCache, handleRole} = useContent();
  const {currentUser} = useAuth();
  const [state, setState] = useState<StudentCORProps | undefined>(undefined);
  const [section, setSection] = useState<string | null | undefined>(null);

  function setUpSection() {
    handleNavigation('UserInfo');
  }
  // const getSection = useCallback(async () => {
  //   try {
  //     const sectionAsync = await AsyncStorage.getItem('section');
  //     console.log({sectionAsync});
  //     if (sectionAsync !== null) {
  //       return setSection(JSON.parse(sectionAsync));
  //     }
  //     await AsyncStorage.setItem('section', 'false');
  //     const unsub = collectionRef('student')
  //       .where('email', '==', currentUser?.email)
  //       .onSnapshot(snapshot => {
  //         const isSectionExist = snapshot.docs[0]?.data().section;
  //         return setSection(isSectionExist === undefined);
  //       });
  //     return unsub();
  //   } catch (err) {
  //     console.log(err);
  //   }
  // }, [currentUser, section]);
  const renderSectionBannerSetup = () => {
    return (
      section === undefined && (
        <View className="flex-row justify-center bg-yellow-100 p-2">
          <Text className="mr-2 text-xs text-yellow-600">
            Looks like you didn't have your class section set-up.
          </Text>
          <TouchableOpacity onPress={setUpSection}>
            <Text className="text-xs text-yellow-600 underline">Tap here</Text>
          </TouchableOpacity>
        </View>
      )
    );
  };
  useEffect(() => {
    async function setupForStudents() {
      const usersCache = await handleUsersCache();
      const filteredUsersCache = usersCache.filter(
        ({email}) => currentUser?.email === email,
      );
      setSection(filteredUsersCache[0]?.section ?? undefined);
      try {
        async function fetchStudentInfo() {
          if (currentUser !== null) {
            const studInfo = await collectionRef('student')
              .where('email', '==', currentUser.email)
              .get();
            const data = studInfo.docs[0]?.data();
            // console.log({data});
            // TODO: Swap auth uid to student no
            return data;
          }
        }
        async function checkIfStudentIsMayor(email: string) {
          const result = await collectionRef('mayor')
            .where('email', '==', email)
            .count()
            .get();
          return result.data().count;
        }
        const array = await handleUsersCache();
        const filteredArray: StudentCORProps[] | undefined = array.filter(
          ({email}) => currentUser?.email === email,
        );
        if (filteredArray.length === 0) {
          const snapshot = await fetchStudentInfo();
          if (snapshot !== undefined) {
            const data = snapshot as StudentCORProps;
            const result = await handleUsersCache(data);
            const filteredResult: StudentCORProps[] | undefined = result.filter(
              ({email}) => currentUser?.email === email,
            );
            const selectedEmail = filteredResult[0]?.email ?? '';
            // console.log('Newly inserted into cache array', {selectedEmail});
            const count = await checkIfStudentIsMayor(selectedEmail);
            setState(filteredResult[0]);
            count > 0 &&
              (await collectionRef('student')
                .doc(filteredResult[0]?.studentNo)
                .update({recipient: 'bm'}));
            return handleRole(count > 0 ? 'mayor' : role);
          }
        } else if (filteredArray === undefined) {
          return Alert.alert(
            "Error in fetching student info, you're not registered",
          );
        }
        const selectedEmail = filteredArray[0]?.email ?? '';
        // console.log('Existing inside cache array', {selectedEmail});
        const count = await checkIfStudentIsMayor(selectedEmail);
        setState(filteredArray[0]);
        count > 0 &&
          (await collectionRef('student')
            .doc(filteredArray[0]?.studentNo)
            .update({recipient: 'bm'}));
        handleRole(count > 0 ? 'mayor' : role);
      } catch (err) {
        ToastAndroid.show(
          'Error in setting up student in Home',
          ToastAndroid.SHORT,
        );
      }
    }
    return void setupForStudents();
  }, [handleUsersCache, handleRole, role, currentUser]);

  return (
    <View className="flex-1">
      <Background>
        {renderSectionBannerSetup()}
        <ScrollView>
          <Usertab name={state === undefined ? 'null' : `${state.name}!`} />
          <CalendarOfActivities />
          <Announcements />
        </ScrollView>
      </Background>
      <View>
        <FooterNav />
      </View>
    </View>
  );
};

export default Home;
