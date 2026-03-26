import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Header, Button, Card } from '@/core/components';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

export function ExportScreen({ navigation }: any) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);

  const handlePdf = async () => {
    setPdfLoading(true);
    setTimeout(() => {
      setPdfLoading(false);
      Alert.alert('PDF Ready', 'Fleet_Report_March_2026.pdf has been generated and is ready to share.');
    }, 1500);
  };

  const handleCsv = async () => {
    setCsvLoading(true);
    setTimeout(() => {
      setCsvLoading(false);
      Alert.alert('CSV Ready', 'Fleet_Data_March_2026.csv has been generated and is ready to download.');
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <Header title="Export Data" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.icon}>📄</Text>
          <Text style={styles.label}>Monthly Cost Report</Text>
          <Text style={styles.desc}>Complete fleet spending, sessions, and savings analysis</Text>
          <Button
            title="Generate PDF"
            onPress={handlePdf}
            loading={pdfLoading}
            variant="outline"
            size="sm"
            style={{ marginTop: spacing.md }}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.icon}>📊</Text>
          <Text style={styles.label}>Raw Session Data</Text>
          <Text style={styles.desc}>All charging sessions — suitable for accounting / ERP import</Text>
          <Button
            title="Generate CSV"
            onPress={handleCsv}
            loading={csvLoading}
            variant="outline"
            size="sm"
            style={{ marginTop: spacing.md }}
          />
        </Card>

        <Card style={styles.historyCard}>
          <Text style={styles.historyTitle}>Previous Exports</Text>
          {['Feb_2026_Report.pdf', 'Jan_2026_Data.csv', 'Q4_2025_Summary.pdf'].map((file, i) => (
            <Text key={i} style={styles.historyItem}>• {file}</Text>
          ))}
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  card: { alignItems: 'center', marginBottom: spacing.md, paddingVertical: spacing.xl },
  icon: { fontSize: 40, marginBottom: spacing.sm },
  label: { ...(typography.bodyBold as object), color: colors.text, marginBottom: spacing.xs },
  desc: { ...(typography.caption as object), color: colors.textSecondary, textAlign: 'center' },
  historyCard: { marginTop: spacing.sm },
  historyTitle: { ...(typography.bodyBold as object), color: colors.text, marginBottom: spacing.sm },
  historyItem: { ...(typography.body as object), color: colors.textSecondary, fontSize: 14, marginBottom: spacing.xs },
});
