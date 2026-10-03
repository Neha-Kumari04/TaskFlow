import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Card, SectionHeader } from '../components/Layout';
import { tasksToCsv } from '../data/csvService';
import { FileServiceError, shareCsvFile } from '../data/fileService';
import { useTasks } from '../context/TaskContext';
import { useTheme } from '../theme/ThemeContext';
import { useConfirmDialog } from '../hooks/useConfirmDialog';

function SettingRow({ icon, iconColorKey, label, description, right, onPress, danger }) {
  const { colors } = useTheme();
  const tint = danger ? colors.danger : colors[iconColorKey] || colors.primary;

  const content = (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: colors[danger ? 'dangerSoft' : `${iconColorKey || 'primary'}Soft`] || colors.primarySoft }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowLabel, { color: danger ? colors.danger : colors.text }]}>{label}</Text>
        {Boolean(description) && <Text style={[styles.rowDescription, { color: colors.textMuted }]}>{description}</Text>}
      </View>
      {right}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      {content}
    </Pressable>
  );
}

export default function SettingsScreen({ navigation }) {
  const { colors, isDark, setMode } = useTheme();
  const { tasks, stats, clearAllTasks } = useTasks();
  const { confirm, dialog } = useConfirmDialog();

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (tasks.length === 0) {
      confirm({
        title: 'Nothing to export',
        message: 'There are no tasks saved on this device yet.',
        confirmLabel: 'Got it',
        cancelLabel: 'Close',
        onConfirm: () => {},
      });
      return;
    }

    setIsExporting(true);
    try {
      const csv = tasksToCsv(tasks);
      const fileName = `taskflow-tasks-${new Date().toISOString().slice(0, 10)}.csv`;
      await shareCsvFile(fileName, csv);
    } catch (error) {
      confirm({
        title: 'Export failed',
        message: error instanceof FileServiceError ? error.message : 'The CSV file could not be created.',
        confirmLabel: 'OK',
        cancelLabel: 'Close',
        onConfirm: () => {},
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearAll = () => {
    if (tasks.length === 0) {
      confirm({
        title: 'Nothing to clear',
        message: 'Your task list is already empty.',
        confirmLabel: 'Got it',
        cancelLabel: 'Close',
        onConfirm: () => {},
      });
      return;
    }

    confirm({
      title: 'Clear all tasks',
      message: `This permanently deletes all ${tasks.length} task${tasks.length === 1 ? '' : 's'} from this device. This cannot be undone.`,
      confirmLabel: 'Delete everything',
      cancelLabel: 'Cancel',
      destructive: true,
      onConfirm: () => {
        confirm({
          title: 'Are you absolutely sure?',
          message: 'All tasks will be lost.',
          confirmLabel: 'Yes, clear all',
          cancelLabel: 'Keep my tasks',
          destructive: true,
          onConfirm: async () => {
            await clearAllTasks();
            confirm({
              title: 'Tasks cleared',
              message: 'All tasks have been deleted from this device.',
              confirmLabel: 'Done',
              cancelLabel: 'Close',
              onConfirm: () => {},
            });
          },
        });
      },
    });
  };

  const dataMetrics = [
    { label: 'Total', value: stats.total, color: colors.primary },
    { label: 'Pending', value: stats.pending, color: colors.info },
    { label: 'Completed', value: stats.completed, color: colors.success },
    { label: 'Overdue', value: stats.overdue, color: colors.danger },
  ];

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Manage appearance, data and the CSV workflow.
        </Text>
      </View>

      <SectionHeader title="Appearance" />
      <Card style={styles.card}>
        <View style={styles.themeRow}>
          {[
            { key: 'light', label: 'Light', icon: 'sunny-outline' },
            { key: 'dark', label: 'Dark', icon: 'moon-outline' },
          ].map((option) => {
            const active = (isDark ? 'dark' : 'light') === option.key;
            return (
              <Pressable
                key={option.key}
                onPress={() => setMode(option.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${option.label} theme`}
                style={({ pressed }) => [
                  styles.themeOption,
                  {
                    backgroundColor: active ? colors.primarySoft : colors.surfaceAlt,
                    borderColor: active ? colors.primary : colors.border,
                    opacity: pressed ? 0.88 : 1,
                    shadowColor: active ? colors.primary : 'transparent',
                    shadowOpacity: active ? 0.18 : 0,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: active ? 2 : 0,
                  },
                ]}
              >
                <Ionicons name={option.icon} size={22} color={active ? colors.primary : colors.textMuted} />
                <Text style={[styles.themeLabel, { color: active ? colors.primary : colors.textMuted }]}>
                  {option.label}
                </Text>
                {active && <Ionicons name="checkmark-circle" size={17} color={colors.primary} />}
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <SettingRow
          icon="contrast-outline"
          iconColorKey="primary"
          label="Dark mode"
          description="Switch between light and dark themes"
          right={
            <Switch
              value={isDark}
              onValueChange={(value) => setMode(value ? 'dark' : 'light')}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Toggle dark mode"
            />
          }
        />
      </Card>

      <SectionHeader title="Data" style={styles.sectionSpacing} />
      <Card style={styles.card}>
        <View style={styles.dataGrid}>
          {dataMetrics.map((item) => (
            <View
              key={item.label}
              style={[styles.dataCell, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
            >
              <Text style={[styles.dataValue, { color: item.color }]}>{item.value}</Text>
              <Text style={[styles.dataLabel, { color: colors.textMuted }]}>{item.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card style={styles.card}>
        <SettingRow
          icon="cloud-upload-outline"
          iconColorKey="info"
          label="Bulk upload tasks"
          description="Import tasks from a CSV file on this device"
          onPress={() => navigation.navigate('BulkUpload')}
          right={<Ionicons name="chevron-forward" size={18} color={colors.textFaint} />}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <SettingRow
          icon="download-outline"
          iconColorKey="success"
          label="Export tasks to CSV"
          description={tasks.length > 0 ? `Share ${tasks.length} task${tasks.length === 1 ? '' : 's'} as a CSV file` : 'No tasks to export yet'}
          onPress={handleExport}
          right={
            isExporting ? (
              <Text style={[styles.rowMeta, { color: colors.textMuted }]}>Preparing…</Text>
            ) : (
              <Ionicons name="share-outline" size={18} color={colors.textFaint} />
            )
          }
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <SettingRow
          icon="trash-outline"
          label="Clear all tasks"
          description="Permanently delete every task on this device"
          danger
          onPress={handleClearAll}
          right={<Ionicons name="chevron-forward" size={18} color={colors.danger} />}
        />
      </Card>

      <SectionHeader title="CSV format" style={styles.sectionSpacing} />
      <Card style={styles.card}>
        <Text style={[styles.csvText, { color: colors.textMuted }]}>
          Exported files use the same column order that TaskFlow imports, so any export can be uploaded again without
          losing data.
        </Text>
        <View style={[styles.codeBlock, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
          <Text style={[styles.codeText, { color: colors.textMuted }]}>
            id,title,description,category,priority,{'\n'}start_date,due_date,status
          </Text>
        </View>
      </Card>

      <SectionHeader title="About" style={styles.sectionSpacing} />
      <Card style={styles.card}>
        <SettingRow
          icon="information-circle-outline"
          iconColorKey="primary"
          label="TaskFlow"
          description="Local-first task manager · all data stays on this device"
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <SettingRow
          icon="code-slash-outline"
          iconColorKey="primary"
          label="Reset to an empty state"
          description="Useful while testing the CSV import flow"
          onPress={() =>
            confirm({
              title: 'Reset app data',
              message: 'This clears tasks and resets the theme to light mode.',
              confirmLabel: 'Reset',
              cancelLabel: 'Cancel',
              destructive: true,
              onConfirm: async () => {
                await clearAllTasks();
                setMode('light');
                confirm({
                  title: 'App reset',
                  message: 'Tasks cleared and light theme restored.',
                  confirmLabel: 'Done',
                  cancelLabel: 'Close',
                  onConfirm: () => {},
                });
              },
            })
          }
          right={<Ionicons name="chevron-forward" size={18} color={colors.textFaint} />}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <SettingRow
          icon="help-circle-outline"
          iconColorKey="info"
          label="Where is my data stored?"
          description="Tasks are saved locally with AsyncStorage. Nothing is uploaded to a server."
          onPress={() => Linking.openURL('https://react-native-async-storage.github.io/async-storage/')}
          right={<Ionicons name="open-outline" size={17} color={colors.textFaint} />}
        />
      </Card>

      <Text style={[styles.footer, { color: colors.textFaint }]}>TaskFlow · React Native + Expo</Text>
      {dialog}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
    gap: 14,
  },
  header: {
    gap: 4,
    paddingTop: 6,
    paddingBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13.5,
  },
  sectionSpacing: {
    marginTop: 6,
  },
  card: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  rowDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  rowMeta: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  themeLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dataCell: {
    width: '47%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  dataValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  dataLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  csvText: {
    fontSize: 12.5,
    lineHeight: 19,
  },
  codeBlock: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  codeText: {
    fontSize: 11.5,
    fontWeight: '700',
    lineHeight: 18,
  },
  footer: {
    textAlign: 'center',
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 10,
  },
});
