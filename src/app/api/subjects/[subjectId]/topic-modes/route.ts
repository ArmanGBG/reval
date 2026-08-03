import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/subjects/:subjectId/topic-modes
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  const { subjectId } = await params;
  const topicModes = await db.topicMode.findMany({
    where: { subjectId, isActive: true },
    orderBy: { modeNo: 'asc' },
  });
  return NextResponse.json({ topicModes });
}

// POST /api/subjects/:subjectId/topic-modes
// Body: { title, description?, modeNo? }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  const { subjectId } = await params;
  try {
    const body = await request.json();
    const { title, description, modeNo } = body;
    if (!title) {
      return NextResponse.json({ error: 'عنوان مبحث الزامی است' }, { status: 400 });
    }

    let nextNo = modeNo;
    if (typeof nextNo !== 'number') {
      const last = await db.topicMode.findFirst({
        where: { subjectId },
        orderBy: { modeNo: 'desc' },
      });
      nextNo = last ? last.modeNo + 1 : 1;
    }

    const topicMode = await db.topicMode.create({
      data: { subjectId, title, description: description || null, modeNo: nextNo, sortOrder: nextNo },
    });
    return NextResponse.json({ topicMode }, { status: 201 });
  } catch (error) {
    console.error('POST topic-mode error:', error);
    return NextResponse.json({ error: 'خطا در ایجاد مبحث' }, { status: 500 });
  }
}
