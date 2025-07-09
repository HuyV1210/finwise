import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import type { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
};

type WelcomeScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Welcome'>;
};

export default function Welcome({ navigation }: WelcomeScreenProps) {
  return (
    <LinearGradient
      colors={['#00D09E', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.centered}>
        <Text style={styles.welcomeText}>Welcome to</Text>
        <Text style={styles.welcomeText}>Expense Tracker!</Text>
        <Text style={styles.sloganText}>
          Track your expenses, talk to your AI finance assistant, and stay in control of your money.
        </Text>
      </View>
      <ScrollView style={styles.subContainer} contentContainerStyle={styles.imageContainer}>
        <View style={styles.circleImageWrapper}>
          <View style={styles.circle} />
          <Image source={require('../assets/welcome/welcome.png')} style={styles.image} />
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingBottom: 60,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#222',
    fontFamily: 'Poppins-ExtraBold',
  },
  sloganText: {
    fontSize: 14,
    color: '#222',
    textAlign: 'center',
    fontFamily: 'Poppins-Light',
    marginTop: 10,
  },
  subContainer: {
    backgroundColor: '#F1FFF3',
    borderTopRightRadius: 60,
    borderTopLeftRadius: 60,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    minHeight: 400,
  },
  circleImageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 300,
    height: 300,
    marginBottom: 30,
  },
  circle: {
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#DFF7E2',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 0,
  },
  image: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
    zIndex: 1,
  },
  buttonContainer: {
    backgroundColor: '#00D09E',
    width: 300,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
  },
  buttonText: {
    fontSize: 22,
    fontWeight: '700',
    color: 'black',
  },
});