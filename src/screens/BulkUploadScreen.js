import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import PriorityBadge from '../components/PriorityBadge';
import { Card, SectionHeader } from '../components/Layout';
import { analyzeCsv } from '../data/csvService';
import { FileServiceError, formatBytes, pickCsvFile } from '../data/fileService';
import { useTasks } from '../context/TaskContext';
import { useTheme } from '../theme/ThemeContext';
import { formatDateShort } from '../utils/date';
import { useConfirmDialog } from '../hooks/useConfirmDialog';

const CSV_SCHEMA = ['id', 'title', 'description', 'category', 'priority', 'start_date', 'due_date', 'status'];

function StatBox({ label, value, colorKey, tone }) {
  const { colors } = useTheme();
  const fg = colorKey ? colors[colorKey] : colors.text;

  return (
    <View style={[styles.statBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
      <Text style={[styles.statBoxValue, { color: tone === 'danger' ? colors.danger : fg }]}>{value}</Text>
      <Text style={[styles.statBoxLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function IssueRow({ rowNumber, title, messages, tone }) {
  const { colors } = useTheme();
  const color = tone === 'duplicate' ? colors.warning : colors.danger;

  return (
    <View style={[styles.issueRow, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}>
      <View style={[styles.issueBadge, { backgroundColor: tone === 'duplicate' ? colors.warningSoft : colors.dangerSoft }]}>
        <Text style={[styles.issueBadgeText, { color: tone === 'duplicate' ? colors.warning : colors.danger }]}>
          {tone === 'duplicate' ? 'DUPLICATE' : 'INVALID'}
        </Text>
      </View>
      <View style={styles.issueBody}>
        <Text style={[styles.issueTitle, { color: colors.text }]} numberOfLines={1}>
          {`Row ${rowNumber}${title ? ` · ${title}` : ''}`}
        </Text>
        {messages.map((message, index) => (
          <Text key={`${message}-${index}`} style={[styles.issueMessage, { color }]}>
            {`• ${message}`}
          </Text>
        ))}
      </View>
    </View>
  );
}

function PreviewRow({ item }) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable
      onPress={() => setExpanded((prev) => !prev)}
      accessibilityRole="button"
      accessibilityLabel={`Preview row ${item.rowNumber}`}
      style={({ pressed }) => [
        styles.previewRow,
        { borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.previewMain}>
        <Text style={[styles.previewTitle, { color: colors.text }]} numberOfLines={1}>
          {item.task.title}
        </Text>
        <Text style={[styles.previewMeta, { color: colors.textMuted }]} numberOfLines={1}>
          {`Row ${item.rowNumber} · ${item.task.category} · ${formatDateShort(item.task.startDate)} → ${formatDateShort(item.task.dueDate)}`}
        </Text>
      </View>
      <PriorityBadge priority={item.task.priority} size="small" />
      <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textFaint} />
      {expanded && (
        <View style={[styles.previewDetail, { borderTopColor: colors.border }]}>
          <Text style={[styles.previewDescription, { color: colors.textMuted }]}>
            {item.task.description || 'No description'}
          </Text>
          <Text style={[styles.previewDescription, { color: colors.textMuted }]}>
            {`Status: ${item.task.status} · Priority: ${item.task.priority} · CSV id: ${item.task.csvId ?? '—'}`}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export default function BulkUploadScreen({ navigation }) {
  const { colors } = useTheme();
  const { tasks, importTasks } = useTasks();
  const { confirm, dialog } = useConfirmDialog();

  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [isReading, setIsReading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState('valid');

  const reset = useCallback(() => {
    setFile(null);
    setAnalysis(null);
    setResult(null);
    setLoadError(null);
    setTab('valid');
  }, []);

  const handlePick = async () => {
    setLoadError(null);
    setResult(null);
    setIsReading(true);
    try {
      const picked = await pickCsvFile();
      if (!picked) {
        setIsReading(false);
        return;
      }

      const report = analyzeCsv(picked.content, tasks);

      if (!report.ok) {
        setFile({ ...picked.meta });
        setAnalysis(null);
        setLoadError(report.error);
        setIsReading(false);
        return;
      }

      if (report.totalRows === 0) {
        setFile(picked.meta);
        setAnalysis(null);
        setLoadError('This file does not contain any task rows.');
        setIsReading(false);
        return;
      }

      setFile(picked.meta);
      setAnalysis(report);
      setTab(report.valid.length > 0 ? 'valid' : 'invalid');
    } catch (error) {
      setLoadError(
        error instanceof FileServiceError ? error.message : 'Something went wrong while reading this file.'
      );
    } finally {
      setIsReading(false);
    }
  };

  const handleImport = () => {
    if (!analysis || analysis.valid.length === 0) return;

    confirm({
      title: 'Import tasks',
      message: `${analysis.valid.length} task${analysis.valid.length === 1 ? '' : 's'} will be added to your list. Duplicates and invalid rows will be skipped.`,
      confirmLabel: 'Import',
      cancelLabel: 'Cancel',
      onConfirm: () => {
        setIsImporting(true);
        const added = importTasks(analysis.valid.map((item) => item.task));
        setResult({
          imported: added,
          skippedDuplicates: analysis.duplicates.length,
          skippedInvalid: analysis.invalid.length,
          totalRows: analysis.totalRows,
          fileName: file?.name,
        });
        setIsImporting(false);
        if (added > 0) {
          setTab('valid');
        }
      },
    });
  };

  const hasIssues = analysis && (analysis.invalid.length > 0 || analysis.duplicates.length > 0);

  const tabs = useMemo(() => {
    if (!analysis) return [];
    return [
      { key: 'valid', label: `Valid (${analysis.valid.length})`, colorKey: 'success' },
      { key: 'invalid', label: `Invalid (${analysis.invalid.length})`, colorKey: 'danger' },
      { key: 'duplicates', label: `Duplicates (${analysis.duplicates.length})`, colorKey: 'warning' },
    ].filter((item) => !(item.key === 'invalid' && analysis.invalid.length === 0) && !(item.key === 'duplicates' && analysis.duplicates.length === 0));
  }, [analysis]);

  if (result) {
    const failed = result.skippedDuplicates + result.skippedInvalid;
    return (
      <ScrollView
        style={[styles.root, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centered}>
          <View style={[styles.resultIcon, { backgroundColor: result.imported > 0 ? colors.successSoft : colors.dangerSoft }]}>
            <Text style={styles.resultIconText}>{result.imported > 0 ? '✅' : '⚠️'}</Text>
          </View>
          <Text style={[styles.resultTitle, { color: colors.text }]}>
            {result.imported > 0 ? 'Import complete' : 'Nothing was imported'}
          </Text>
          <Text style={[styles.resultSubtitle, { color: colors.textMuted }]}>
            {`${result.fileName} · ${result.totalRows} row${result.totalRows === 1 ? '' : 's'} processed`}
          </Text>
        </View>

        <Card style={styles.card}>
          <View style={styles.resultStats}>
            <StatBox label="Imported" value={result.imported} colorKey="success" />
            <StatBox label="Duplicates skipped" value={result.skippedDuplicates} colorKey="warning" />
            <StatBox label="Invalid skipped" value={result.skippedInvalid} colorKey="danger" />
          </View>

          <View
            style={[
              styles.summaryBar,
              { backgroundColor: result.imported > 0 ? colors.successSoft : colors.dangerSoft },
            ]}
          >
            <Text
              style={[
                styles.summaryText,
                { color: result.imported > 0 ? colors.success : colors.danger },
              ]}
            >
              {result.imported > 0
                ? `${result.imported} task${result.imported === 1 ? '' : 's'} added successfully${
                    failed > 0 ? `, ${failed} row${failed === 1 ? '' : 's'} skipped` : ''
                  }.`
                : `All ${result.totalRows} rows were skipped. Nothing new was added.`}
            </Text>
          </View>
        </Card>

        <View style={styles.actions}>
          <Button title="View all tasks" icon="📋" size="large" onPress={() => navigation.navigate('MainTabs', { screen: 'Tasks' })} />
          <Button title="Import another file" icon="⇪" variant="secondary" onPress={reset} />
          <Button title="Back to upload" variant="ghost" onPress={() => setResult(null)} />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Card style={styles.dropCard}>
        <View style={[styles.uploadIcon, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="cloud-upload-outline" size={30} color={colors.primary} />
        </View>
        <Text style={[styles.dropTitle, { color: colors.text }]}>Bulk upload tasks</Text>
        <Text style={[styles.dropText, { color: colors.textMuted }]}>
          Select a CSV file from your device. Every row is validated before anything is saved, and you can review the
          result before importing.
        </Text>

        <Button
          title={isReading ? 'Reading file…' : file ? 'Choose a different file' : 'Choose CSV file'}
          icon="📄"
          size="large"
          loading={isReading}
          onPress={handlePick}
        />

        {!!file && (
          <View style={[styles.fileCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <View style={[styles.fileIcon, { backgroundColor: colors.infoSoft }]}>
              <Ionicons name="document-text" size={18} color={colors.info} />
            </View>
            <View style={styles.fileBody}>
              <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
                {file.name}
              </Text>
              <Text style={[styles.fileMeta, { color: colors.textMuted }]}>
                {formatBytes(file.size)}
                {file.extension ? ` · .${file.extension}` : ''}
                {analysis ? ` · ${analysis.totalRows} row${analysis.totalRows === 1 ? '' : 's'}` : ''}
              </Text>
            </View>
            <Pressable onPress={reset} hitSlop={10} accessibilityRole="button" accessibilityLabel="Remove file">
              <Ionicons name="close-circle" size={20} color={colors.textFaint} />
            </Pressable>
          </View>
        )}
      </Card>

      {!!loadError && (
        <View style={[styles.errorBanner, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <Text style={[styles.errorText, { color: colors.danger }]}>{loadError}</Text>
        </View>
      )}

      {!file && !loadError && (
        <Card style={styles.schemaCard}>
          <Text style={[styles.schemaTitle, { color: colors.text }]}>Expected CSV format</Text>
          <Text style={[styles.schemaHint, { color: colors.textMuted }]}>
            Column order is flexible and a header row is optional. Column names are matched case-insensitively, so{' '}
            <Text style={styles.mono}>start_date</Text>, <Text style={styles.mono}>startDate</Text> and{' '}
            <Text style={styles.mono}>Start Date</Text> all work.
          </Text>
          <View style={styles.schemaGrid}>
            {CSV_SCHEMA.map((column) => (
              <View key={column} style={[styles.schemaChip, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Text style={[styles.schemaChipText, { color: colors.textMuted }]}>{column}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.schemaHint, { color: colors.textMuted }]}>
            Priority must be <Text style={styles.mono}>low</Text>, <Text style={styles.mono}>medium</Text> or{' '}
            <Text style={styles.mono}>high</Text>. Status must be <Text style={styles.mono}>pending</Text> or{' '}
            <Text style={styles.mono}>completed</Text>. Dates must be readable as <Text style={styles.mono}>YYYY-MM-DD</Text>.
          </Text>
        </Card>
      )}

      {!!analysis && (
        <>
          <Card style={styles.card}>
            <View style={styles.resultStats}>
              <StatBox label="Total rows" value={analysis.totalRows} colorKey="primary" />
              <StatBox label="Valid" value={analysis.valid.length} colorKey="success" />
              <StatBox label="Issues" value={analysis.invalid.length + analysis.duplicates.length} colorKey="danger" />
            </View>
            <Text style={[styles.analysisMeta, { color: colors.textMuted }]}>
              {`Delimiter “${analysis.delimiter}” · ${analysis.columnCount} columns · ${
                analysis.hasHeader ? 'header row detected' : 'no header row, matched by position'
              }`}
            </Text>
          </Card>

          {hasIssues && (
            <View style={[styles.warnBanner, { backgroundColor: colors.warningSoft }]}>
              <Ionicons name="information-circle" size={18} color={colors.warning} />
              <Text style={[styles.warnText, { color: colors.warning }]}>
                {analysis.valid.length > 0
                  ? `${analysis.valid.length} valid row${analysis.valid.length === 1 ? '' : 's'} can be imported. The rows below will be skipped.`
                  : 'No rows can be imported. Fix the issues below and select the file again.'}
              </Text>
            </View>
          )}

          {tabs.length > 0 && (
            <View style={styles.tabRow}>
              {tabs.map((item) => {
                const active = tab === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setTab(item.key)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    style={({ pressed }) => [
                      styles.tab,
                      {
                        backgroundColor: active ? colors[item.colorKey] : colors.surface,
                        borderColor: active ? colors[item.colorKey] : colors.border,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.tabText, { color: active ? colors.primaryText : colors.textMuted }]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          <View style={styles.listWrap}>
            {tab === 'valid' &&
              (analysis.valid.length === 0 ? (
                <Card>
                  <EmptyState
                    icon="🚫"
                    title="No valid rows"
                    message="Every row in this file has an issue, so there is nothing to import."
                  />
                </Card>
              ) : (
                analysis.valid.slice(0, 50).map((item) => <PreviewRow key={`valid-${item.rowNumber}`} item={item} />)
              ))}

            {tab === 'invalid' &&
              (analysis.invalid.length === 0 ? (
                <Card>
                  <EmptyState icon="✅" title="No invalid rows" message="Every row passed validation." />
                </Card>
              ) : (
                analysis.invalid.map((item) => (
                  <IssueRow
                    key={`invalid-${item.rowNumber}`}
                    rowNumber={item.rowNumber}
                    title={item.preview}
                    messages={item.errors.map((error) => error.message)}
                    tone="invalid"
                  />
                ))
              ))}

            {tab === 'duplicates' &&
              (analysis.duplicates.length === 0 ? (
                <Card>
                  <EmptyState icon="🎉" title="No duplicates" message="No row matched an existing task." />
                </Card>
              ) : (
                analysis.duplicates.map((item) => (
                  <IssueRow
                    key={`dupe-${item.rowNumber}`}
                    rowNumber={item.rowNumber}
                    title={item.preview}
                    messages={[item.reason]}
                    tone="duplicate"
                  />
                ))
              ))}
          </View>

          {analysis.valid.length > 50 && (
            <Text style={[styles.truncationNote, { color: colors.textMuted }]}>
              {`Showing the first 50 valid rows. All ${analysis.valid.length} will be imported.`}
            </Text>
          )}

          <View style={styles.actions}>
            <Button
              title={`Import ${analysis.valid.length} task${analysis.valid.length === 1 ? '' : 's'}`}
              icon="⇪"
              size="large"
              disabled={analysis.valid.length === 0}
              loading={isImporting}
              onPress={handleImport}
            />
            {analysis.valid.length === 0 && (
              <Button title="Choose another file" variant="secondary" onPress={handlePick} />
            )}
          </View>
        </>
      )}

      <SectionHeader title="How imports work" style={styles.howHeader} />
      <Card style={styles.howCard}>
        {[
          'Duplicate ids, or rows with the same title, start date and due date, are skipped.',
          'Rows are checked against the tasks already saved on this device.',
          'Only valid rows are written to local storage — invalid rows never reach your task list.',
          'Importing the same file twice will not create duplicates.',
        ].map((line) => (
          <View key={line} style={styles.howRow}>
            <Ionicons name="ellipse" size={7} color={colors.primary} style={styles.howDot} />
            <Text style={[styles.howText, { color: colors.textMuted }]}>{line}</Text>
          </View>
        ))}
      </Card>
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
  card: {
    gap: 14,
  },
  dropCard: {
    alignItems: 'center',
    gap: 12,
  },
  uploadIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dropTitle: {
    fontSize: 19,
    fontWeight: '800',
  },
  dropText: {
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 4,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    width: '100%',
  },
  fileIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileBody: {
    flex: 1,
    gap: 2,
  },
  fileName: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  fileMeta: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  warnBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 13,
    borderRadius: 14,
  },
  warnText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 18,
  },
  schemaCard: {
    gap: 11,
  },
  schemaTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  schemaHint: {
    fontSize: 12.5,
    lineHeight: 19,
  },
  mono: {
    fontWeight: '800',
  },
  schemaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  schemaChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  schemaChipText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  resultStats: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 3,
  },
  statBoxValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  statBoxLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  analysisMeta: {
    fontSize: 11.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '800',
  },
  listWrap: {
    gap: 8,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  previewMain: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  previewTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  previewMeta: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  previewDetail: {
    width: '100%',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 9,
    gap: 4,
  },
  previewDescription: {
    fontSize: 12,
    lineHeight: 17,
  },
  issueRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  issueBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
    alignSelf: 'flex-start',
  },
  issueBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  issueBody: {
    flex: 1,
    gap: 3,
  },
  issueTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  issueMessage: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  truncationNote: {
    fontSize: 11.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  actions: {
    gap: 10,
  },
  howHeader: {
    marginTop: 6,
  },
  howCard: {
    gap: 9,
  },
  howRow: {
    flexDirection: 'row',
    gap: 9,
    alignItems: 'flex-start',
  },
  howDot: {
    marginTop: 6,
  },
  howText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
  },
  centered: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 20,
  },
  resultIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  resultIconText: {
    fontSize: 34,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  resultSubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  summaryBar: {
    padding: 13,
    borderRadius: 14,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    textAlign: 'center',
  },
});
