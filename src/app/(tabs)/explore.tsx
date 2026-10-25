import React from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BrandColors } from '@/constants/theme';
import { Button } from '@/components/ui/button';

export default function ExploreScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Water Quality & Technology Guide</Text>
        <Text style={styles.subtitle}>
          Learn how purification technologies protect your family and select the right system for your home.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO CARD */}
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>HOW IT WORKS</Text>
          <Text style={styles.heroTitle}>Multi-Stage Purification Explained</Text>
          <Text style={styles.heroDesc}>
            Modern water purifiers combine physical filtration with membrane separation and germicidal UV to remove up to 99.9% of dissolved impurities, heavy metals, and microbes.
          </Text>
        </View>

        {/* TECHNOLOGY COMPARISON */}
        <Text style={styles.sectionHeading}>Core Technologies</Text>

        <View style={styles.techCard}>
          <View style={styles.techHeader}>
            <Text style={styles.techIcon}>💧</Text>
            <View>
              <Text style={styles.techName}>RO (Reverse Osmosis)</Text>
              <Text style={styles.techRole}>For high TDS water (&gt; 300 PPM)</Text>
            </View>
          </View>
          <Text style={styles.techBody}>
            Forces water through a semi-permeable 0.0001 micron membrane under pressure. Removes dissolved salts, heavy metals (lead, arsenic), and fluoride.
          </Text>
        </View>

        <View style={styles.techCard}>
          <View style={styles.techHeader}>
            <Text style={styles.techIcon}>☀️</Text>
            <View>
              <Text style={styles.techName}>UV (Ultraviolet Disinfection)</Text>
              <Text style={styles.techRole}>For biological safety</Text>
            </View>
          </View>
          <Text style={styles.techBody}>
            Employs high-intensity germicidal UV rays to disinfect water by inactivating bacteria, cysts, and viruses without altering the natural mineral taste.
          </Text>
        </View>

        <View style={styles.techCard}>
          <View style={styles.techHeader}>
            <Text style={styles.techIcon}>🌿</Text>
            <View>
              <Text style={styles.techName}>Alkaline & Mineral Infusion</Text>
              <Text style={styles.techRole}>Balanced pH & Essential Minerals</Text>
            </View>
          </View>
          <Text style={styles.techBody}>
            Post-purification cartridge enriches water with essential minerals like calcium and magnesium while elevating pH to 8.0–8.5 for optimal hydration.
          </Text>
        </View>

        {/* TDS GUIDE CARD */}
        <Text style={[styles.sectionHeading, { marginTop: 24 }]}>TDS Level Water Guide</Text>
        <View style={styles.guideCard}>
          <View style={styles.guideRow}>
            <View style={[styles.guideIndicator, { backgroundColor: '#10B981' }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.guideRange}>50 – 150 PPM: Excellent</Text>
              <Text style={styles.guideDesc}>Ideal for drinking. UV or UF purification recommended.</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.guideRow}>
            <View style={[styles.guideIndicator, { backgroundColor: '#3B82F6' }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.guideRange}>150 – 300 PPM: Good</Text>
              <Text style={styles.guideDesc}>Standard tap or municipal water. RO or RO+UV recommended.</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.guideRow}>
            <View style={[styles.guideIndicator, { backgroundColor: '#F59E0B' }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.guideRange}>300 – 900 PPM: Fair / Hard Water</Text>
              <Text style={styles.guideDesc}>Borewell or groundwater. Multi-stage RO system required.</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.guideRow}>
            <View style={[styles.guideIndicator, { backgroundColor: '#EF4444' }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.guideRange}>&gt; 900 PPM: Poor</Text>
              <Text style={styles.guideDesc}>Heavy mineral contamination. Commercial / High GPD RO essential.</Text>
            </View>
          </View>
        </View>

        {/* MAINTENANCE ADVISORY */}
        <Text style={[styles.sectionHeading, { marginTop: 24 }]}>Maintenance Frequency</Text>
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleItem}>
            <Text style={styles.scheduleTime}>Every 3 Months</Text>
            <Text style={styles.scheduleTask}>Clean / replace external pre-filter sediment candle</Text>
          </View>
          <View style={styles.scheduleItem}>
            <Text style={styles.scheduleTime}>Every 6 Months</Text>
            <Text style={styles.scheduleTask}>Sanitize storage tank & replace inline carbon block</Text>
          </View>
          <View style={styles.scheduleItem}>
            <Text style={styles.scheduleTime}>Every 12 Months</Text>
            <Text style={styles.scheduleTask}>Complete kit overhaul: RO membrane, UV lamp & mineral cartridge</Text>
          </View>
        </View>

        {/* CTA TO BOOK SERVICE */}
        <View style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>Need Your Purifier Inspected?</Text>
          <Text style={styles.ctaSubtitle}>
            Schedule an expert technician visit for free water TDS testing, filter replacement, or new installation.
          </Text>
          <Button
            title="Book a Technician Visit"
            onPress={() => router.push('/service-booking')}
            style={{ marginTop: 14 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#005D62',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#80DEEA',
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 6,
  },
  heroDesc: {
    fontSize: 12,
    color: '#E0F2F1',
    marginTop: 6,
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  techCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  techHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  techIcon: {
    fontSize: 24,
  },
  techName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  techRole: {
    fontSize: 11,
    color: BrandColors.primary,
    fontWeight: '600',
  },
  techBody: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  guideCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 16,
  },
  guideRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  guideIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  guideRange: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  guideDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  scheduleItem: {
    borderLeftWidth: 3,
    borderLeftColor: BrandColors.primary,
    paddingLeft: 10,
  },
  scheduleTime: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  scheduleTask: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  ctaCard: {
    backgroundColor: BrandColors.primaryLight,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 16,
    padding: 18,
    marginTop: 22,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#004D40',
    textAlign: 'center',
  },
  ctaSubtitle: {
    fontSize: 12,
    color: '#00695C',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
});
