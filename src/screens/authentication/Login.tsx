import React, {useState} from 'react';
import {Alert, Text, View} from 'react-native';
import {Button, Link} from '~/components/Button';
import {Heading} from '~/components/Heading';
import {Textfield} from '~/components/Textfield';
import {useAuth} from '~/contexts/AuthContext';
import {useNav} from '~/contexts/NavigationContext';
import {Error} from '~/utils/error';
import {validateEmail} from '~/utils/firebase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const {signInWithEmail} = useAuth();
  const {navigateTo} = useNav();

  function handleRegisterPress() {
    navigateTo('Register');
  }

  function handleForgotPasswordPress() {
    navigateTo('ForgotPass');
  }

  async function handleLoginPress() {
    if (!validateEmail(email)) {
      return Alert.alert(
        'Invalid Email',
        'Please enter a valid email address.',
      );
    }
    if (!email || !password) {
      return Alert.alert(
        'Empty Fields',
        'Please enter your email and password.',
      );
    }
    try {
      await signInWithEmail(email, password);
      // console.log(currentUser);
    } catch (err) {
      const {code} = err as Error;
      return Alert.alert(code);
    }
  }

  return (
    <View className="h-2/3 justify-center">
      <Heading>Login</Heading>
      <View className="mb-2 w-2/3 self-center">
        <Textfield
          placeholder="Email Address"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
      </View>
      <View className="mb-2 w-2/3 self-center">
        <Textfield
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>
      <View className="mb-2 w-1/3 self-center">
        <Button onPress={handleLoginPress}>Login</Button>
      </View>
      <View className="flex-row gap-2 self-center">
        <Text>Don't have an account?</Text>
        <Link textStyle="text-primary/60" onPress={handleRegisterPress}>
          Register here
        </Link>
      </View>
      <Text className="text-center">or</Text>
      <Link
        textStyle="text-primary/60 text-center"
        onPress={handleForgotPasswordPress}>
        Forgot password?
      </Link>
    </View>
  );
};

export default Login;
