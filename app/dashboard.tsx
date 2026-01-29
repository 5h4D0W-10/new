
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
// import { COLORS, SHADOWS } from './constants/theme';
import { SHADOWS } from './constants/theme';
import { useTheme } from './context/ThemeContext';

const { width } = Dimensions.get('window');

export default function Dashboard() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const Greeting = () => (
    <MotiView
      from={{ opacity: 0, translateY: -20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 800 }}
      style={styles.header}
    >
      <Text style={[styles.greeting, { color: colors.text }]}>Hi, Tejas 👋</Text>
      <Text style={[styles.date, { color: colors.textSecondary }]}>{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
    </MotiView>
  );

  const MainCard = () => (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', delay: 300 }}
    >
      <Pressable
        style={({ pressed }) => [
          styles.card,
          styles.mainCard,
          { backgroundColor: colors.cardBg },
          pressed && { transform: [{ scale: 0.98 }] }
        ]}
        onPress={() => router.push('/newentry' as any)}
      >
        <LinearGradient
          colors={['#6C63FF', '#8E2DE2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientOverlay}
        />
        <View style={styles.cardContent}>
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name="pencil" size={32} color="#fff" />
          </View>
          <View>
            <Text style={styles.cardTitleWhite}>New Diary Entry</Text>
            <Text style={styles.cardSubWhite}>Capture your day...</Text>
          </View>
        </View>
      </Pressable>
    </MotiView>
  );

  const ActionCard = ({ title, sub, icon, color, delay, route }: any) => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', delay }}
      style={styles.actionCardWrapper}
    >
      <Pressable
        style={({ pressed }) => [
          styles.card,
          styles.actionCard,
          { backgroundColor: colors.cardBg },
          pressed && { transform: [{ scale: 0.98 }] }
        ]}
        onPress={() => router.push(route)}
      >
        <View style={[styles.miniIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{sub}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={isDark ? '#555' : "#ccc"} style={styles.chevron} />
      </Pressable>
    </MotiView>
  );

  return (
    <LinearGradient
      colors={colors.background as any}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Greeting />
        <MainCard />

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Explore</Text>

        <ActionCard
          title="Previous Entries"
          sub="Walk down memory lane"
          icon="book-outline"
          color="#FF6584"
          delay={500}
          route="/entries"
        />

        <ActionCard
          title="Calendar"
          sub="Your journey in days"
          icon="calendar-outline"
          color="#4facfe"
          delay={600}
          route="/calendar"
        />

        <ActionCard
          title="Settings"
          sub="Personalize your safe space"
          icon="settings-outline"
          color="#636E72"
          delay={700}
          route="/settings"
        />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 25,
    paddingTop: 70,
  },
  header: {
    marginBottom: 30,
  },
  greeting: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  date: {
    fontSize: 16,
    marginTop: 5,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 15,
    marginLeft: 5,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 15,
    ...SHADOWS.medium,
  },
  mainCard: {
    height: 160,
    justifyContent: 'center',
    padding: 0,
    overflow: 'hidden', // for gradient
    marginBottom: 20,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    padding: 25,
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  cardTitleWhite: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardSubWhite: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
    fontSize: 15,
  },
  actionCardWrapper: {
    width: '100%',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 22,
  },
  miniIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardSub: {
    fontSize: 14,
    marginTop: 2,
  },
  chevron: {
    marginLeft: 'auto',
  },
});
