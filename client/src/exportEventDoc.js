import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, BorderStyle, ShadingType
} from 'docx';
import { saveAs } from 'file-saver';
import api from './api';

export async function exportEventToWord(eventId, eventInfo) {
  // Fetch all data
  const [tasksRes, budgetRes, fundraisingRes] = await Promise.all([
    api.get(`/tasks/event/${eventId}`),
    api.get(`/finances/event/${eventId}?section=budget`),
    api.get(`/finances/event/${eventId}?section=fundraising`)
  ]);

  const tasks = tasksRes.data || [];
  const budgetItems = budgetRes.data?.finances || [];
  const fundraisingItems = fundraisingRes.data?.finances || [];

  const sections = [];

  // --- TITLE & EVENT INFO ---
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: eventInfo.title, bold: true, size: 48, font: 'Calibri' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 }
    })
  );

  if (eventInfo.organization) {
    sections.push(new Paragraph({
      children: [new TextRun({ text: eventInfo.organization, size: 28, color: '4F46E5', font: 'Calibri' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }));
  }

  // Event details
  const details = [];
  if (eventInfo.start_date) details.push(`Date: ${eventInfo.start_date}`);
  if (eventInfo.event_time) details.push(`Time: ${eventInfo.event_time}`);
  if (eventInfo.event_location) details.push(`Location: ${eventInfo.event_location}`);
  if (eventInfo.description) details.push(`Description: ${eventInfo.description}`);

  for (const detail of details) {
    sections.push(new Paragraph({
      children: [new TextRun({ text: detail, size: 22, font: 'Calibri' })],
      spacing: { after: 80 }
    }));
  }

  // Members
  if (eventInfo.members?.length > 0) {
    sections.push(new Paragraph({
      children: [new TextRun({ text: `Team Members: ${eventInfo.members.map(m => m.username).join(', ')}`, size: 22, font: 'Calibri' })],
      spacing: { after: 200 }
    }));
  }

  sections.push(new Paragraph({ children: [], spacing: { after: 200 } }));

  // --- TASKS SECTION ---
  sections.push(new Paragraph({
    text: 'Tasks & To-Do',
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 300, after: 200 }
  }));

  if (tasks.length === 0) {
    sections.push(new Paragraph({ children: [new TextRun({ text: 'No tasks created yet.', italics: true, size: 22 })] }));
  } else {
    // Group by category
    const categories = {};
    for (const task of tasks) {
      const cat = task.category_name || 'Uncategorized';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(task);
    }

    for (const [catName, catTasks] of Object.entries(categories)) {
      sections.push(new Paragraph({
        text: catName,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }));

      // Tasks table
      const headerRow = new TableRow({
        children: ['Task', 'Assigned To', 'Status', 'Deadline'].map(text =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, font: 'Calibri' })] })],
            shading: { type: ShadingType.SOLID, color: '4F46E5', fill: '4F46E5' },
            width: { size: 25, type: WidthType.PERCENTAGE }
          })
        )
      });

      const dataRows = catTasks.map(task =>
        new TableRow({
          children: [
            task.title,
            task.assigned_username || 'Unassigned',
            task.status || 'pending',
            task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'
          ].map(text =>
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text, size: 20, font: 'Calibri' })] })],
              width: { size: 25, type: WidthType.PERCENTAGE }
            })
          )
        })
      );

      sections.push(new Table({
        rows: [headerRow, ...dataRows],
        width: { size: 100, type: WidthType.PERCENTAGE }
      }));

      sections.push(new Paragraph({ children: [], spacing: { after: 100 } }));
    }

    // Task summary
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const completed = tasks.filter(t => t.status === 'completed').length;

    sections.push(new Paragraph({
      children: [new TextRun({ text: `Summary: ${completed} completed, ${inProgress} in progress, ${pending} pending (${tasks.length} total)`, size: 20, italics: true, font: 'Calibri' })],
      spacing: { before: 100, after: 300 }
    }));
  }

  // --- BUDGET SECTION ---
  sections.push(new Paragraph({
    text: 'Event Budget',
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 300, after: 200 }
  }));

  if (budgetItems.length === 0) {
    sections.push(new Paragraph({ children: [new TextRun({ text: 'No budget items yet.', italics: true, size: 22 })] }));
  } else {
    const budgetHeader = new TableRow({
      children: ['Vendor', 'Item Type', 'Qty', 'Price/Item', 'Total'].map(text =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, font: 'Calibri', color: 'FFFFFF' })] })],
          shading: { type: ShadingType.SOLID, color: '4F46E5', fill: '4F46E5' },
          width: { size: 20, type: WidthType.PERCENTAGE }
        })
      )
    });

    const budgetRows = budgetItems.map(item => {
      const total = ((item.quantity || 0) * (item.price_per_item || 0)).toFixed(2);
      return new TableRow({
        children: [
          item.vendor || '',
          item.item_type || '',
          String(item.quantity || 0),
          `$${(item.price_per_item || 0).toFixed(2)}`,
          `$${total}`
        ].map(text =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text, size: 20, font: 'Calibri' })] })],
            width: { size: 20, type: WidthType.PERCENTAGE }
          })
        )
      });
    });

    const budgetTotal = budgetItems.reduce((sum, i) => sum + (i.quantity || 0) * (i.price_per_item || 0), 0);
    const totalRow = new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [] })], columnSpan: 3, width: { size: 60, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Total:', bold: true, size: 20, font: 'Calibri' })] })], width: { size: 20, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${budgetTotal.toFixed(2)}`, bold: true, size: 20, font: 'Calibri' })] })], width: { size: 20, type: WidthType.PERCENTAGE } })
      ]
    });

    sections.push(new Table({
      rows: [budgetHeader, ...budgetRows, totalRow],
      width: { size: 100, type: WidthType.PERCENTAGE }
    }));

    sections.push(new Paragraph({ children: [], spacing: { after: 300 } }));
  }

  // --- FUNDRAISING SECTION ---
  sections.push(new Paragraph({
    text: 'Fundraising',
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 300, after: 200 }
  }));

  if (fundraisingItems.length === 0) {
    sections.push(new Paragraph({ children: [new TextRun({ text: 'No fundraising activities yet.', italics: true, size: 22 })] }));
  } else {
    const fundHeader = new TableRow({
      children: ['Source', 'Description', 'Revenue', 'Expenses', 'Net'].map(text =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, font: 'Calibri', color: 'FFFFFF' })] })],
          shading: { type: ShadingType.SOLID, color: '16A34A', fill: '16A34A' },
          width: { size: 20, type: WidthType.PERCENTAGE }
        })
      )
    });

    const fundRows = fundraisingItems.map(item => {
      const rev = item.revenue || item.amount || 0;
      const exp = item.expense || 0;
      return new TableRow({
        children: [
          item.source || '',
          item.description || '',
          `$${rev.toFixed(2)}`,
          `$${exp.toFixed(2)}`,
          `$${(rev - exp).toFixed(2)}`
        ].map(text =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text, size: 20, font: 'Calibri' })] })],
            width: { size: 20, type: WidthType.PERCENTAGE }
          })
        )
      });
    });

    const totalRev = fundraisingItems.reduce((s, i) => s + (i.revenue || i.amount || 0), 0);
    const totalExp = fundraisingItems.reduce((s, i) => s + (i.expense || 0), 0);
    const fundTotalRow = new TableRow({
      children: ['', 'Totals', `$${totalRev.toFixed(2)}`, `$${totalExp.toFixed(2)}`, `$${(totalRev - totalExp).toFixed(2)}`].map((text, i) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text, bold: i > 0, size: 20, font: 'Calibri' })] })],
          width: { size: 20, type: WidthType.PERCENTAGE }
        })
      )
    });

    sections.push(new Table({
      rows: [fundHeader, ...fundRows, fundTotalRow],
      width: { size: 100, type: WidthType.PERCENTAGE }
    }));
  }

  // --- FOOTER ---
  sections.push(new Paragraph({ children: [], spacing: { after: 400 } }));
  sections.push(new Paragraph({
    children: [new TextRun({ text: `Generated on ${new Date().toLocaleDateString()} by Semester Collab`, size: 18, italics: true, color: '999999', font: 'Calibri' })],
    alignment: AlignmentType.CENTER
  }));

  // Build document
  const doc = new Document({
    sections: [{
      children: sections
    }]
  });

  const blob = await Packer.toBlob(doc);
  const filename = `${eventInfo.title.replace(/\s+/g, '-')}-report-${new Date().toISOString().split('T')[0]}.docx`;
  saveAs(blob, filename);
}
