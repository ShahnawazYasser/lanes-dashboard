-- Lanes Dashboard seed data.
-- End dates and comment timestamps are relative to the seed run date so the
-- traffic light and daysSince() demo correctly whenever this is (re)seeded.

truncate table prospect_comments, prospects, contracts restart identity cascade;

-- ---------------------------------------------------------------------------
-- Contracts (12 total: R1-R6 racks, W1-W3 wall, P1-P2 pop-up, K1 kiosk)
-- Traffic light: 2 red (< 4 weeks), 4 amber (4-8 weeks), 6 green (8+ weeks)
-- ---------------------------------------------------------------------------

insert into contracts
  (brand, category, space, start_date, end_date, rent, terms, contact_name, phone, owner, renewal_status, notes)
values
  ('Noor Loom',        'womenswear', 'R1', current_date - interval '18 months', current_date + interval '200 days', 75000, '12 month, renewable',        'Sana Malik',    '03211234501', 'Ali', 'Not discussed', ''),
  ('Freya Pret',        'pret',       'R2', current_date - interval '11 months', current_date + interval '40 days',  68000, '12 month, renewable',        'Bilal Ahmed',   '03211234502', 'Ali', 'In talks',      'Wants a rent review before renewing.'),
  ('Saqib & Sons',      'menswear',   'R3', current_date - interval '23 months', current_date + interval '10 days',  82000, '12 month, renewable',        'Saqib Raza',    '03211234503', 'Ali', 'Not discussed', 'Ending soon, no response yet to renewal message.'),
  ('Tiny Trunk',        'kidswear',   'R4', current_date - interval '9 months',  current_date + interval '150 days', 55000, '12 month, renewable',        'Ayesha Farooq', '03211234504', 'Ali', 'Not discussed', ''),
  ('Meherma Jewels',    'jewellery',  'R5', current_date - interval '14 months', current_date + interval '35 days',  90000, '12 month, renewable',        'Meher Khan',    '03211234505', 'Ali', 'Renewing',      'Verbally confirmed renewal, paperwork pending.'),
  ('Glow Bar',          'beauty',     'R6', current_date - interval '7 months',  current_date + interval '300 days', 60000, '12 month, renewable',        'Zara Shah',     '03211234506', 'Ali', 'Not discussed', ''),
  ('Chevron Home',      'home',       'W1', current_date - interval '20 months', current_date + interval '45 days',  95000, '12 month, renewable',        'Hamza Iqbal',   '03211234507', 'Ali', 'In talks',      ''),
  ('Resham Studio',     'unstitched', 'W2', current_date - interval '25 months', current_date + interval '5 days',   88000, '12 month, renewable',        'Rabia Noor',    '03211234508', 'Ali', 'Leaving',       'Confirmed they are closing this space, not renewing.'),
  ('Clasp & Co',        'accessories','W3', current_date - interval '6 months',  current_date + interval '180 days', 50000, '12 month, renewable',        'Danyal Aziz',   '03211234509', 'Ali', 'Not discussed', ''),
  ('Paper Trail Books', 'books',      'P1', current_date - interval '10 months', current_date + interval '50 days',  45000, '6 month, renewable',         'Fatima Sheikh', '03211234510', 'Ali', 'In talks',      ''),
  ('Lunaro',            'Photobooth', 'P2', current_date - interval '4 months',  current_date + interval '220 days', 60000, '6 month, renewable',         'Omar Sultan',   '03211234511', 'Ali', 'Not discussed', ''),
  ('Bean There Café',   'café',       'K1', current_date - interval '30 months', current_date + interval '400 days', 70000, '24 month, renewable',        'Imran Baig',    '03211234512', 'Ali', 'Not discussed', '');

-- ---------------------------------------------------------------------------
-- Prospects (16 total; 5 with a join_date within the next 3 months, 2 of
-- them requesting W2 -- the space Resham Studio is leaving)
-- ---------------------------------------------------------------------------

insert into prospects
  (name, category, contact_name, phone, tags, status, first_contacted, join_date, space)
values
  ('Threadline Studio',   'pret',        'Nida Kamal',    '03221234601', array['Shown interest','Given comments'], 'Replied',       current_date - interval '20 days', current_date + interval '30 days', 'W2'),
  ('Kamal Unstitched Co', 'unstitched',  'Kamal Riaz',    '03221234602', array['Shown interest'],                  'Replied',       current_date - interval '14 days', current_date + interval '45 days', 'W2'),
  ('Little Nawab',        'kidswear',    'Sadia Yousuf',  '03221234603', array['Shown interest'],                  'No reply',      current_date - interval '33 days', current_date + interval '60 days', 'R4'),
  ('Silver Leaf Jewellers','jewellery',  'Adeel Chaudhry','03221234604', array[]::text[],                          'Not contacted', current_date - interval '2 days',  null, ''),
  ('Urban Sole',           'accessories','Waleed Anjum',  '03221234605', array['Shown interest','Given comments'], 'Converted',     current_date - interval '90 days', current_date - interval '10 days', 'R2'),
  ('Cafe Noir',            'café',       'Mahnoor Aslam', '03221234606', array['Shown interest','Given comments'], 'Replied',       current_date - interval '25 days', current_date + interval '90 days', 'K1'),
  ('Bloom Beauty Bar',     'beauty',     'Hira Salman',   '03221234607', array['Shown interest'],                  'No reply',      current_date - interval '55 days', null, ''),
  ('Vintage Vogue',        'womenswear', 'Noman Sheikh',  '03221234608', array[]::text[],                          'Not contacted', current_date - interval '5 days',  null, ''),
  ('Boy Meets Style',      'menswear',   'Usman Tariq',   '03221234609', array['Given comments'],                  'Replied',       current_date - interval '18 days', current_date + interval '75 days', 'R3'),
  ('Chapter One Books',    'books',      'Rida Naveed',   '03221234610', array['Shown interest'],                  'No reply',      current_date - interval '40 days', null, ''),
  ('Home Grid',            'home',       'Faisal Mehmood','03221234611', array[]::text[],                          'Not contacted', current_date - interval '9 days',  null, ''),
  ('Sundari Jewels',       'jewellery',  'Sana Qureshi',  '03221234612', array['Given comments'],                  'Replied',       current_date - interval '48 days', null, ''),
  ('Pixel Pop Studio',     'accessories','Talha Rasheed', '03221234613', array['Shown interest'],                  'No reply',      current_date - interval '70 days', null, ''),
  ('Wanderlust Wear',      'pret',       'Iqra Habib',    '03221234614', array[]::text[],                          'Not contacted', current_date - interval '3 days',  null, ''),
  ('Kidoz Corner',         'kidswear',   'Owais Ghani',   '03221234615', array['Shown interest','Given comments'], 'Converted',     current_date - interval '120 days', current_date - interval '30 days', 'R4'),
  ('Café Latte Lounge',    'café',       'Mariam Idrees', '03221234616', array[]::text[],                          'Not contacted', current_date - interval '1 days',  null, '');

-- ---------------------------------------------------------------------------
-- Prospect comments (created_at spread 2-70 days ago)
-- ---------------------------------------------------------------------------

insert into prospect_comments (prospect_id, body, created_at)
values
  ((select id from prospects where name = 'Threadline Studio'),   'Asked about rent and minimum term for W2.',            now() - interval '2 days'),
  ((select id from prospects where name = 'Kamal Unstitched Co'), 'Sent floor plan, waiting on their confirmation.',      now() - interval '5 days'),
  ((select id from prospects where name = 'Boy Meets Style'),     'Visited the space, liked R3, following up next week.', now() - interval '9 days'),
  ((select id from prospects where name = 'Cafe Noir'),           'Discussed kiosk fit-out requirements.',                now() - interval '11 days'),
  ((select id from prospects where name = 'Little Nawab'),        'Left a voice note, no response yet.',                  now() - interval '14 days'),
  ((select id from prospects where name = 'Sundari Jewels'),      'Shared rent card, said they would think about it.',    now() - interval '18 days'),
  ((select id from prospects where name = 'Threadline Studio'),   'First call, they are keen on the unstitched space.',   now() - interval '20 days'),
  ((select id from prospects where name = 'Chapter One Books'),   'Emailed brochure, no reply since.',                    now() - interval '25 days'),
  ((select id from prospects where name = 'Urban Sole'),          'Signed and moved into R2.',                            now() - interval '33 days'),
  ((select id from prospects where name = 'Bloom Beauty Bar'),    'Asked for a callback, none scheduled.',                now() - interval '40 days'),
  ((select id from prospects where name = 'Pixel Pop Studio'),    'Initial WhatsApp enquiry about a pop-up slot.',        now() - interval '55 days'),
  ((select id from prospects where name = 'Kidoz Corner'),        'Onboarded, contract signed separately.',               now() - interval '70 days');
