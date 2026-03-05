-- ========================================
-- Seed Data for 크몽 Clone Platform
-- ========================================

-- Categories: 10 대분류 + 40 중분류 + 120 소분류
-- Top-level categories (depth 0)
INSERT INTO categories (name, slug, parent_id, depth, sort_order, icon) VALUES
('디자인', 'design', NULL, 0, 1, 'Palette'),
('IT·프로그래밍', 'it-programming', NULL, 0, 2, 'Code'),
('영상·사진·음향', 'video-photo-audio', NULL, 0, 3, 'Video'),
('마케팅', 'marketing', NULL, 0, 4, 'Megaphone'),
('번역·통역', 'translation', NULL, 0, 5, 'Languages'),
('문서·글쓰기', 'writing', NULL, 0, 6, 'FileText'),
('비즈니스 컨설팅', 'business', NULL, 0, 7, 'Briefcase'),
('주문제작', 'custom', NULL, 0, 8, 'Hammer'),
('레슨·코칭', 'lesson', NULL, 0, 9, 'GraduationCap'),
('세무·법무·노무', 'legal', NULL, 0, 10, 'Scale');

-- 디자인 중분류
INSERT INTO categories (name, slug, parent_id, depth, sort_order) VALUES
('로고·브랜딩', 'design-logo', (SELECT id FROM categories WHERE slug='design'), 1, 1),
('웹·모바일 디자인', 'design-web', (SELECT id FROM categories WHERE slug='design'), 1, 2),
('인쇄물·판촉물', 'design-print', (SELECT id FROM categories WHERE slug='design'), 1, 3),
('일러스트·캐릭터', 'design-illustration', (SELECT id FROM categories WHERE slug='design'), 1, 4);

-- 디자인 소분류
INSERT INTO categories (name, slug, parent_id, depth, sort_order) VALUES
('로고 디자인', 'design-logo-logo', (SELECT id FROM categories WHERE slug='design-logo'), 2, 1),
('CI/BI 디자인', 'design-logo-ci', (SELECT id FROM categories WHERE slug='design-logo'), 2, 2),
('명함 디자인', 'design-logo-card', (SELECT id FROM categories WHERE slug='design-logo'), 2, 3),
('웹사이트 디자인', 'design-web-website', (SELECT id FROM categories WHERE slug='design-web'), 2, 1),
('앱 UI 디자인', 'design-web-app', (SELECT id FROM categories WHERE slug='design-web'), 2, 2),
('랜딩페이지', 'design-web-landing', (SELECT id FROM categories WHERE slug='design-web'), 2, 3),
('전단지·포스터', 'design-print-flyer', (SELECT id FROM categories WHERE slug='design-print'), 2, 1),
('패키지 디자인', 'design-print-package', (SELECT id FROM categories WHERE slug='design-print'), 2, 2),
('메뉴판·카탈로그', 'design-print-catalog', (SELECT id FROM categories WHERE slug='design-print'), 2, 3),
('캐릭터 디자인', 'design-illust-character', (SELECT id FROM categories WHERE slug='design-illustration'), 2, 1),
('일러스트', 'design-illust-illust', (SELECT id FROM categories WHERE slug='design-illustration'), 2, 2),
('이모티콘', 'design-illust-emoticon', (SELECT id FROM categories WHERE slug='design-illustration'), 2, 3);

-- IT·프로그래밍 중분류
INSERT INTO categories (name, slug, parent_id, depth, sort_order) VALUES
('웹 개발', 'it-web', (SELECT id FROM categories WHERE slug='it-programming'), 1, 1),
('앱 개발', 'it-app', (SELECT id FROM categories WHERE slug='it-programming'), 1, 2),
('데이터·AI', 'it-data', (SELECT id FROM categories WHERE slug='it-programming'), 1, 3),
('서버·인프라', 'it-server', (SELECT id FROM categories WHERE slug='it-programming'), 1, 4);

-- IT 소분류
INSERT INTO categories (name, slug, parent_id, depth, sort_order) VALUES
('홈페이지 제작', 'it-web-homepage', (SELECT id FROM categories WHERE slug='it-web'), 2, 1),
('쇼핑몰 제작', 'it-web-shop', (SELECT id FROM categories WHERE slug='it-web'), 2, 2),
('웹앱 개발', 'it-web-webapp', (SELECT id FROM categories WHERE slug='it-web'), 2, 3),
('iOS 앱', 'it-app-ios', (SELECT id FROM categories WHERE slug='it-app'), 2, 1),
('안드로이드 앱', 'it-app-android', (SELECT id FROM categories WHERE slug='it-app'), 2, 2),
('크로스플랫폼 앱', 'it-app-cross', (SELECT id FROM categories WHERE slug='it-app'), 2, 3),
('데이터 분석', 'it-data-analysis', (SELECT id FROM categories WHERE slug='it-data'), 2, 1),
('머신러닝', 'it-data-ml', (SELECT id FROM categories WHERE slug='it-data'), 2, 2),
('챗봇 개발', 'it-data-chatbot', (SELECT id FROM categories WHERE slug='it-data'), 2, 3),
('AWS 구축', 'it-server-aws', (SELECT id FROM categories WHERE slug='it-server'), 2, 1),
('DevOps', 'it-server-devops', (SELECT id FROM categories WHERE slug='it-server'), 2, 2),
('보안 점검', 'it-server-security', (SELECT id FROM categories WHERE slug='it-server'), 2, 3);

-- 영상·사진·음향 중분류
INSERT INTO categories (name, slug, parent_id, depth, sort_order) VALUES
('영상 편집', 'video-editing', (SELECT id FROM categories WHERE slug='video-photo-audio'), 1, 1),
('모션그래픽', 'video-motion', (SELECT id FROM categories WHERE slug='video-photo-audio'), 1, 2),
('사진 촬영·보정', 'video-photo', (SELECT id FROM categories WHERE slug='video-photo-audio'), 1, 3),
('음향·음악', 'video-audio', (SELECT id FROM categories WHERE slug='video-photo-audio'), 1, 4);

-- 영상 소분류
INSERT INTO categories (name, slug, parent_id, depth, sort_order) VALUES
('유튜브 편집', 'video-edit-youtube', (SELECT id FROM categories WHERE slug='video-editing'), 2, 1),
('광고 영상', 'video-edit-ad', (SELECT id FROM categories WHERE slug='video-editing'), 2, 2),
('웨딩 영상', 'video-edit-wedding', (SELECT id FROM categories WHERE slug='video-editing'), 2, 3),
('인트로·아웃트로', 'video-motion-intro', (SELECT id FROM categories WHERE slug='video-motion'), 2, 1),
('로고 모션', 'video-motion-logo', (SELECT id FROM categories WHERE slug='video-motion'), 2, 2),
('인포그래픽 영상', 'video-motion-info', (SELECT id FROM categories WHERE slug='video-motion'), 2, 3),
('상품 촬영', 'video-photo-product', (SELECT id FROM categories WHERE slug='video-photo'), 2, 1),
('프로필 촬영', 'video-photo-profile', (SELECT id FROM categories WHERE slug='video-photo'), 2, 2),
('사진 보정', 'video-photo-retouch', (SELECT id FROM categories WHERE slug='video-photo'), 2, 3),
('작곡·편곡', 'video-audio-compose', (SELECT id FROM categories WHERE slug='video-audio'), 2, 1),
('나레이션', 'video-audio-narration', (SELECT id FROM categories WHERE slug='video-audio'), 2, 2),
('MR 제작', 'video-audio-mr', (SELECT id FROM categories WHERE slug='video-audio'), 2, 3);

-- 마케팅 중분류
INSERT INTO categories (name, slug, parent_id, depth, sort_order) VALUES
('SNS 마케팅', 'marketing-sns', (SELECT id FROM categories WHERE slug='marketing'), 1, 1),
('검색 마케팅', 'marketing-search', (SELECT id FROM categories WHERE slug='marketing'), 1, 2),
('콘텐츠 마케팅', 'marketing-content', (SELECT id FROM categories WHERE slug='marketing'), 1, 3),
('광고 대행', 'marketing-ad', (SELECT id FROM categories WHERE slug='marketing'), 1, 4);

-- 마케팅 소분류
INSERT INTO categories (name, slug, parent_id, depth, sort_order) VALUES
('인스타그램', 'marketing-sns-insta', (SELECT id FROM categories WHERE slug='marketing-sns'), 2, 1),
('유튜브', 'marketing-sns-youtube', (SELECT id FROM categories WHERE slug='marketing-sns'), 2, 2),
('블로그', 'marketing-sns-blog', (SELECT id FROM categories WHERE slug='marketing-sns'), 2, 3),
('네이버 SEO', 'marketing-search-naver', (SELECT id FROM categories WHERE slug='marketing-search'), 2, 1),
('구글 SEO', 'marketing-search-google', (SELECT id FROM categories WHERE slug='marketing-search'), 2, 2),
('키워드 광고', 'marketing-search-keyword', (SELECT id FROM categories WHERE slug='marketing-search'), 2, 3),
('블로그 글', 'marketing-content-blog', (SELECT id FROM categories WHERE slug='marketing-content'), 2, 1),
('보도자료', 'marketing-content-press', (SELECT id FROM categories WHERE slug='marketing-content'), 2, 2),
('상세페이지', 'marketing-content-detail', (SELECT id FROM categories WHERE slug='marketing-content'), 2, 3),
('페이스북 광고', 'marketing-ad-fb', (SELECT id FROM categories WHERE slug='marketing-ad'), 2, 1),
('구글 광고', 'marketing-ad-google', (SELECT id FROM categories WHERE slug='marketing-ad'), 2, 2),
('네이버 광고', 'marketing-ad-naver', (SELECT id FROM categories WHERE slug='marketing-ad'), 2, 3);

-- 번역·통역 중분류
INSERT INTO categories (name, slug, parent_id, depth, sort_order) VALUES
('영어', 'trans-english', (SELECT id FROM categories WHERE slug='translation'), 1, 1),
('일본어', 'trans-japanese', (SELECT id FROM categories WHERE slug='translation'), 1, 2),
('중국어', 'trans-chinese', (SELECT id FROM categories WHERE slug='translation'), 1, 3),
('기타 언어', 'trans-other', (SELECT id FROM categories WHERE slug='translation'), 1, 4);

-- 번역 소분류
INSERT INTO categories (name, slug, parent_id, depth, sort_order) VALUES
('일반 번역', 'trans-en-general', (SELECT id FROM categories WHERE slug='trans-english'), 2, 1),
('전문 번역', 'trans-en-professional', (SELECT id FROM categories WHERE slug='trans-english'), 2, 2),
('영상 자막', 'trans-en-subtitle', (SELECT id FROM categories WHERE slug='trans-english'), 2, 3),
('일반 번역', 'trans-jp-general', (SELECT id FROM categories WHERE slug='trans-japanese'), 2, 1),
('만화 번역', 'trans-jp-manga', (SELECT id FROM categories WHERE slug='trans-japanese'), 2, 2),
('게임 번역', 'trans-jp-game', (SELECT id FROM categories WHERE slug='trans-japanese'), 2, 3),
('일반 번역', 'trans-cn-general', (SELECT id FROM categories WHERE slug='trans-chinese'), 2, 1),
('비즈니스 번역', 'trans-cn-business', (SELECT id FROM categories WHERE slug='trans-chinese'), 2, 2),
('통역', 'trans-cn-interpret', (SELECT id FROM categories WHERE slug='trans-chinese'), 2, 3),
('베트남어', 'trans-other-vietnam', (SELECT id FROM categories WHERE slug='trans-other'), 2, 1),
('태국어', 'trans-other-thai', (SELECT id FROM categories WHERE slug='trans-other'), 2, 2),
('스페인어', 'trans-other-spanish', (SELECT id FROM categories WHERE slug='trans-other'), 2, 3);

-- 문서·글쓰기 중분류
INSERT INTO categories (name, slug, parent_id, depth, sort_order) VALUES
('카피라이팅', 'writing-copy', (SELECT id FROM categories WHERE slug='writing'), 1, 1),
('블로그·SNS', 'writing-blog', (SELECT id FROM categories WHERE slug='writing'), 1, 2),
('자기소개서·이력서', 'writing-resume', (SELECT id FROM categories WHERE slug='writing'), 1, 3);

-- 문서 소분류
INSERT INTO categories (name, slug, parent_id, depth, sort_order) VALUES
('광고 카피', 'writing-copy-ad', (SELECT id FROM categories WHERE slug='writing-copy'), 2, 1),
('슬로건', 'writing-copy-slogan', (SELECT id FROM categories WHERE slug='writing-copy'), 2, 2),
('네이밍', 'writing-copy-naming', (SELECT id FROM categories WHERE slug='writing-copy'), 2, 3),
('블로그 포스팅', 'writing-blog-post', (SELECT id FROM categories WHERE slug='writing-blog'), 2, 1),
('SNS 콘텐츠', 'writing-blog-sns', (SELECT id FROM categories WHERE slug='writing-blog'), 2, 2),
('전자책', 'writing-blog-ebook', (SELECT id FROM categories WHERE slug='writing-blog'), 2, 3),
('자기소개서', 'writing-resume-intro', (SELECT id FROM categories WHERE slug='writing-resume'), 2, 1),
('이력서', 'writing-resume-cv', (SELECT id FROM categories WHERE slug='writing-resume'), 2, 2),
('포트폴리오', 'writing-resume-portfolio', (SELECT id FROM categories WHERE slug='writing-resume'), 2, 3);

-- 비즈니스 컨설팅 중분류
INSERT INTO categories (name, slug, parent_id, depth, sort_order) VALUES
('사업계획서', 'biz-plan', (SELECT id FROM categories WHERE slug='business'), 1, 1),
('경영 컨설팅', 'biz-consulting', (SELECT id FROM categories WHERE slug='business'), 1, 2),
('투자 유치', 'biz-invest', (SELECT id FROM categories WHERE slug='business'), 1, 3);

-- 비즈니스 소분류
INSERT INTO categories (name, slug, parent_id, depth, sort_order) VALUES
('사업계획서 작성', 'biz-plan-write', (SELECT id FROM categories WHERE slug='biz-plan'), 2, 1),
('IR 자료', 'biz-plan-ir', (SELECT id FROM categories WHERE slug='biz-plan'), 2, 2),
('정부지원사업', 'biz-plan-gov', (SELECT id FROM categories WHERE slug='biz-plan'), 2, 3),
('경영 전략', 'biz-consult-strategy', (SELECT id FROM categories WHERE slug='biz-consulting'), 2, 1),
('HR 컨설팅', 'biz-consult-hr', (SELECT id FROM categories WHERE slug='biz-consulting'), 2, 2),
('마케팅 전략', 'biz-consult-marketing', (SELECT id FROM categories WHERE slug='biz-consulting'), 2, 3),
('시드 투자', 'biz-invest-seed', (SELECT id FROM categories WHERE slug='biz-invest'), 2, 1),
('시리즈 투자', 'biz-invest-series', (SELECT id FROM categories WHERE slug='biz-invest'), 2, 2),
('크라우드펀딩', 'biz-invest-crowd', (SELECT id FROM categories WHERE slug='biz-invest'), 2, 3);

-- 주문제작 중분류
INSERT INTO categories (name, slug, parent_id, depth, sort_order) VALUES
('핸드메이드', 'custom-handmade', (SELECT id FROM categories WHERE slug='custom'), 1, 1),
('3D 프린팅', 'custom-3d', (SELECT id FROM categories WHERE slug='custom'), 1, 2),
('굿즈 제작', 'custom-goods', (SELECT id FROM categories WHERE slug='custom'), 1, 3);

-- 주문제작 소분류
INSERT INTO categories (name, slug, parent_id, depth, sort_order) VALUES
('악세사리', 'custom-hand-accessory', (SELECT id FROM categories WHERE slug='custom-handmade'), 2, 1),
('가죽 공예', 'custom-hand-leather', (SELECT id FROM categories WHERE slug='custom-handmade'), 2, 2),
('도자기', 'custom-hand-ceramic', (SELECT id FROM categories WHERE slug='custom-handmade'), 2, 3),
('피규어', 'custom-3d-figure', (SELECT id FROM categories WHERE slug='custom-3d'), 2, 1),
('프로토타입', 'custom-3d-proto', (SELECT id FROM categories WHERE slug='custom-3d'), 2, 2),
('건축 모형', 'custom-3d-arch', (SELECT id FROM categories WHERE slug='custom-3d'), 2, 3),
('스티커', 'custom-goods-sticker', (SELECT id FROM categories WHERE slug='custom-goods'), 2, 1),
('에코백', 'custom-goods-ecobag', (SELECT id FROM categories WHERE slug='custom-goods'), 2, 2),
('키링', 'custom-goods-keyring', (SELECT id FROM categories WHERE slug='custom-goods'), 2, 3);

-- 레슨·코칭 중분류
INSERT INTO categories (name, slug, parent_id, depth, sort_order) VALUES
('프로그래밍', 'lesson-programming', (SELECT id FROM categories WHERE slug='lesson'), 1, 1),
('디자인', 'lesson-design', (SELECT id FROM categories WHERE slug='lesson'), 1, 2),
('외국어', 'lesson-language', (SELECT id FROM categories WHERE slug='lesson'), 1, 3);

-- 레슨 소분류
INSERT INTO categories (name, slug, parent_id, depth, sort_order) VALUES
('웹 개발', 'lesson-prog-web', (SELECT id FROM categories WHERE slug='lesson-programming'), 2, 1),
('앱 개발', 'lesson-prog-app', (SELECT id FROM categories WHERE slug='lesson-programming'), 2, 2),
('데이터 분석', 'lesson-prog-data', (SELECT id FROM categories WHERE slug='lesson-programming'), 2, 3),
('포토샵', 'lesson-design-ps', (SELECT id FROM categories WHERE slug='lesson-design'), 2, 1),
('일러스트레이터', 'lesson-design-ai', (SELECT id FROM categories WHERE slug='lesson-design'), 2, 2),
('피그마', 'lesson-design-figma', (SELECT id FROM categories WHERE slug='lesson-design'), 2, 3),
('영어 회화', 'lesson-lang-english', (SELECT id FROM categories WHERE slug='lesson-language'), 2, 1),
('일본어', 'lesson-lang-japanese', (SELECT id FROM categories WHERE slug='lesson-language'), 2, 2),
('중국어', 'lesson-lang-chinese', (SELECT id FROM categories WHERE slug='lesson-language'), 2, 3);

-- 세무·법무·노무 중분류
INSERT INTO categories (name, slug, parent_id, depth, sort_order) VALUES
('세무', 'legal-tax', (SELECT id FROM categories WHERE slug='legal'), 1, 1),
('법무', 'legal-law', (SELECT id FROM categories WHERE slug='legal'), 1, 2),
('노무', 'legal-labor', (SELECT id FROM categories WHERE slug='legal'), 1, 3);

-- 세무법무 소분류
INSERT INTO categories (name, slug, parent_id, depth, sort_order) VALUES
('종합소득세', 'legal-tax-income', (SELECT id FROM categories WHERE slug='legal-tax'), 2, 1),
('부가가치세', 'legal-tax-vat', (SELECT id FROM categories WHERE slug='legal-tax'), 2, 2),
('법인세', 'legal-tax-corp', (SELECT id FROM categories WHERE slug='legal-tax'), 2, 3),
('계약서 검토', 'legal-law-contract', (SELECT id FROM categories WHERE slug='legal-law'), 2, 1),
('법률 자문', 'legal-law-consult', (SELECT id FROM categories WHERE slug='legal-law'), 2, 2),
('상표 등록', 'legal-law-trademark', (SELECT id FROM categories WHERE slug='legal-law'), 2, 3),
('급여 관리', 'legal-labor-payroll', (SELECT id FROM categories WHERE slug='legal-labor'), 2, 1),
('취업규칙', 'legal-labor-rules', (SELECT id FROM categories WHERE slug='legal-labor'), 2, 2),
('노동법 자문', 'legal-labor-consult', (SELECT id FROM categories WHERE slug='legal-labor'), 2, 3);
