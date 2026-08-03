import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/subjects/:subjectId/chapters/:chapterId/topics
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ subjectId: string; chapterId: string }> }
) {
  const { chapterId } = await params;
  const topics = await db.topic.findMany({
    where: { chapterId, isActive: true },
    orderBy: { topicNo: 'asc' },
  });
  return NextResponse.json({ topics });
}

// POST /api/subjects/:subjectId/chapters/:chapterId/topics
// Body: { title, topicNo? }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string; chapterId: string }> }
) {
  const { chapterId } = await params;
  try {
    const body = await request.json();
    const { title, topicNo } = body;
    if (!title) {
      return NextResponse.json({ error: 'عنوان گفتار الزامی است' }, { status: 400 });
    }

    let nextNo = topicNo;
    if (typeof nextNo !== 'number') {
      const last = await db.topic.findFirst({
        where: { chapterId },
        orderBy: { topicNo: 'desc' },
      });
      nextNo = last ? last.topicNo + 1 : 1;
    }

    const topic = await db.topic.create({
      data: { chapterId, title, topicNo: nextNo, sortOrder: nextNo },
    });
    return NextResponse.json({ topic }, { status: 201 });
  } catch (error) {
    console.error('POST topic error:', error);
    return NextResponse.json({ error: 'خطا در ایجاد گفتار' }, { status: 500 });
  }
}
