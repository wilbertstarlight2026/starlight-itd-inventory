import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { db } from '../db/client';
import { requireManagerOrAdmin } from '../middleware/auth';

const reportSchema = z.object({
  type: z.enum(['full_inventory', 'by_category', 'by_department', 'by_status']),
  format: z.enum(['pdf', 'excel']),
  filters: z.object({
    category_id: z.string().uuid().optional(),
    department_id: z.string().uuid().optional(),
    status: z.enum(['available', 'in_use', 'under_repair', 'reserved', 'retired', 'disposed']).optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
  }).optional(),
});

async function fetchReportData(params: z.infer<typeof reportSchema>) {
  const conditions: string[] = ['i.deleted_at IS NULL'];
  const queryParams: unknown[] = [];
  let idx = 1;

  if (params.filters?.category_id) {
    conditions.push(`i.category_id = $${idx++}`);
    queryParams.push(params.filters.category_id);
  }

  if (params.filters?.status) {
    conditions.push(`i.status = $${idx++}`);
    queryParams.push(params.filters.status);
  }

  if (params.filters?.date_from) {
    conditions.push(`i.created_at >= $${idx++}`);
    queryParams.push(params.filters.date_from);
  }

  if (params.filters?.date_to) {
    conditions.push(`i.created_at <= $${idx++}`);
    queryParams.push(params.filters.date_to);
  }

  const where = conditions.join(' AND ');

  const result = await db.query(
    `SELECT
       i.item_code, i.name, i.brand, i.model, i.serial_number,
       i.status, i.condition, i.purchase_date, i.purchase_price,
       i.warranty_expiry, i.created_at,
       c.name as category,
       u.name as assigned_to,
       d.name as department,
       l.name as location,
       a.assigned_at
     FROM items i
     LEFT JOIN categories c ON i.category_id = c.id
     LEFT JOIN assignments a ON a.item_id = i.id AND a.returned_at IS NULL
     LEFT JOIN users u ON a.employee_id = u.id
     LEFT JOIN departments d ON a.department_id = d.id
     LEFT JOIN locations l ON a.location_id = l.id
     WHERE ${where}
     ORDER BY i.item_code`,
    queryParams
  );

  return result.rows as Record<string, unknown>[];
}

export async function reportRoutes(app: FastifyInstance) {
  // GET /reports/dashboard
  app.get('/dashboard', { preHandler: requireManagerOrAdmin }, async (_request, reply) => {
    const [summary, byCategory, recent] = await Promise.all([
      db.query(`
        SELECT
          COUNT(*) as total_items,
          COUNT(*) FILTER (WHERE status = 'available') as available,
          COUNT(*) FILTER (WHERE status = 'in_use') as in_use,
          COUNT(*) FILTER (WHERE status = 'under_repair') as under_repair,
          COUNT(*) FILTER (WHERE status = 'reserved') as reserved,
          COUNT(*) FILTER (WHERE status = 'retired') as retired,
          COUNT(*) FILTER (WHERE status = 'disposed') as disposed
        FROM items WHERE deleted_at IS NULL
      `),
      db.query(`
        SELECT c.name as category, COUNT(i.id) as count
        FROM categories c
        LEFT JOIN items i ON i.category_id = c.id AND i.deleted_at IS NULL
        WHERE c.parent_id IS NULL
        GROUP BY c.name
        ORDER BY count DESC
      `),
      db.query(`
        SELECT al.*, u.name as performed_by_name
        FROM audit_log al
        LEFT JOIN users u ON al.performed_by = u.id
        ORDER BY al.performed_at DESC
        LIMIT 20
      `),
    ]);

    return reply.send({
      success: true,
      data: {
        ...summary.rows[0],
        by_category: byCategory.rows,
        recent_activity: recent.rows,
      },
      error: null,
    });
  });

  // POST /reports/generate — Generate PDF or Excel
  app.post('/generate', { preHandler: requireManagerOrAdmin }, async (request, reply) => {
    const parsed = reportSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        data: null,
        error: parsed.error.errors[0]?.message || 'Invalid input',
      });
    }

    const params = parsed.data;
    const rows = await fetchReportData(params);
    const reportDate = new Date().toLocaleDateString('en-PH', { dateStyle: 'long' });
    const title = `Starlight ITD Inventory — ${params.type.replace(/_/g, ' ').toUpperCase()}`;

    if (params.format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Starlight ITD Inventory System';
      workbook.created = new Date();

      const sheet = workbook.addWorksheet('Inventory Report', {
        pageSetup: { fitToPage: true, orientation: 'landscape' },
      });

      sheet.mergeCells('A1:M1');
      sheet.getCell('A1').value = title;
      sheet.getCell('A1').font = { bold: true, size: 14 };

      sheet.mergeCells('A2:M2');
      sheet.getCell('A2').value = `Generated: ${reportDate}`;
      sheet.getCell('A2').font = { size: 10, color: { argb: 'FF666666' } };

      sheet.addRow([]);

      const headers = [
        'Item Code', 'Name', 'Category', 'Brand', 'Model',
        'Serial Number', 'Status', 'Condition', 'Assigned To',
        'Department', 'Location', 'Purchase Date', 'Purchase Price',
      ];

      const headerRow = sheet.addRow(headers);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' },
        };
      });

      rows.forEach((row, idx) => {
        const dataRow = sheet.addRow([
          row.item_code, row.name, row.category, row.brand, row.model,
          row.serial_number, row.status, row.condition, row.assigned_to,
          row.department, row.location, row.purchase_date, row.purchase_price,
        ]);

        if (idx % 2 === 0) {
          dataRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F7FA' } };
          });
        }
      });

      sheet.columns.forEach((col) => { col.width = 18; });

      const buffer = await workbook.xlsx.writeBuffer();

      reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      reply.header('Content-Disposition', `attachment; filename="inventory-report-${Date.now()}.xlsx"`);
      return reply.send(Buffer.from(buffer));
    }

    // PDF
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    doc
      .fontSize(16)
      .fillColor('#1E3A5F')
      .text('STARLIGHT BUSINESS CONSULTING SERVICES INC', { align: 'center' });
    doc
      .fontSize(12)
      .fillColor('#333')
      .text(title, { align: 'center' });
    doc
      .fontSize(9)
      .fillColor('#666')
      .text(`Generated: ${reportDate}  |  Total Items: ${rows.length}`, { align: 'center' });

    doc.moveDown();

    const colWidths = [70, 150, 80, 70, 80, 90, 70, 70, 100];
    const headers = ['Item Code', 'Name', 'Category', 'Brand', 'Status', 'Assigned To', 'Dept', 'Condition', 'Serial No.'];
    const startX = 40;
    let y = doc.y + 10;

    // Header row
    doc.rect(startX, y, colWidths.reduce((a, b) => a + b), 18).fill('#1E3A5F');
    let x = startX;
    headers.forEach((h, i) => {
      doc.fillColor('#fff').fontSize(8).text(h, x + 3, y + 5, { width: colWidths[i], lineBreak: false });
      x += colWidths[i];
    });

    y += 18;

    rows.forEach((row, rowIdx) => {
      if (y > 520) {
        doc.addPage({ layout: 'landscape' });
        y = 40;
      }

      const bgColor = rowIdx % 2 === 0 ? '#F5F7FA' : '#FFFFFF';
      doc.rect(startX, y, colWidths.reduce((a, b) => a + b), 16).fill(bgColor);

      x = startX;
      const cells = [
        row.item_code, row.name, row.category, row.brand,
        row.status, row.assigned_to || '—', row.department || '—',
        row.condition, row.serial_number || '—',
      ];

      cells.forEach((cell, i) => {
        doc.fillColor('#333').fontSize(7).text(String(cell ?? '—'), x + 3, y + 4, {
          width: colWidths[i] - 6,
          lineBreak: false,
          ellipsis: true,
        });
        x += colWidths[i];
      });

      y += 16;
    });

    doc.end();

    await new Promise<void>((resolve) => doc.on('end', resolve));
    const pdfBuffer = Buffer.concat(chunks);

    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `attachment; filename="inventory-report-${Date.now()}.pdf"`);
    return reply.send(pdfBuffer);
  });
}
