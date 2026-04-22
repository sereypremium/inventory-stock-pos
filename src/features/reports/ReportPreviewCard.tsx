import { Box, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { formatDateTime } from '../../lib/formatters';
import { useAuth } from '../../contexts/AuthContext';
import type { PrintableReportData } from '../../services/reportPrint';

export function ReportPreviewCard({ report }: { report: PrintableReportData }) {
  const { settings } = useAuth();

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Box>
          <Typography sx={{ fontWeight: 700 }} variant="h6">
            {settings.storeName}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {settings.branchName}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {settings.address}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {settings.phone}
          </Typography>
        </Box>

        <Box>
          <Typography variant="h5">{report.title}</Typography>
          <Typography color="text.secondary" variant="body2">
            {report.subtitle}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="caption">
            Generated {formatDateTime(new Date().toISOString())}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          }}
        >
          {report.filters.map((filter) => (
            <Paper key={filter.label} sx={{ p: 1.5 }}>
              <Typography color="text.secondary" variant="caption">
                {filter.label}
              </Typography>
              <Typography sx={{ fontWeight: 700, mt: 0.5 }} variant="body2">
                {filter.value}
              </Typography>
            </Paper>
          ))}
        </Box>

        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          }}
        >
          {report.metrics.map((metric) => (
            <Paper key={metric.label} sx={{ p: 1.5 }}>
              <Typography color="text.secondary" variant="caption">
                {metric.label}
              </Typography>
              <Typography sx={{ fontWeight: 700, mt: 0.5 }} variant="body2">
                {metric.value}
              </Typography>
            </Paper>
          ))}
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {report.columns.map((column) => (
                  <TableCell align={column.align ?? 'left'} key={column.label}>
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {report.rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={report.columns.length}>
                    <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }} variant="body2">
                      {report.emptyMessage}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                report.rows.map((row, rowIndex) => (
                  <TableRow hover key={`${report.title}-${rowIndex}`}>
                    {row.map((cell, cellIndex) => (
                      <TableCell
                        align={report.columns[cellIndex]?.align ?? 'left'}
                        key={`${report.title}-${rowIndex}-${cellIndex}`}
                      >
                        {cell}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography color="text.secondary" variant="caption">
          {settings.reportFooter}
        </Typography>
      </Stack>
    </Paper>
  );
}
