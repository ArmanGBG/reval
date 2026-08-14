-- Reserve sequence number 0 for book prefaces such as «ستایش».
ALTER TABLE "Chapter" DROP CONSTRAINT "Chapter_chapterNo_check";
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_chapterNo_check"
CHECK ("chapterNo" >= 0);

ALTER TABLE "Topic" DROP CONSTRAINT "Topic_topicNo_check";
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_topicNo_check"
CHECK ("topicNo" >= 0);
