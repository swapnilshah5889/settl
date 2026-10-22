import { Redirect } from 'expo-router';
import { useDatabase } from '../hooks/useDatabase';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

export default function Index() {
  const { isReady, currentUser } = useDatabase();

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!currentUser) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
