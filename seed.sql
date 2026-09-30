-- AdmitCrew practice data only. Run after the schema migration and review.
-- All fees and dates are fictional training values, including the five supplied examples.
-- Idempotent with respect to program_code and normalized_phone.
insert into public.programs
 (program_code, university, country, program, fee_text, fee_amount, currency, fee_period, deadline, min_marks, min_ielts, required_documents, source)
values
 ('UK-MAN-CS','University of Manchester','UK','BSc Computer Science','£32,000',32000,'GBP','year','2027-01-15',75,6.5,array['Passport','transcript','IELTS'],'assignment_example'),
 ('UK-LEE-BM','University of Leeds','UK','BSc Business Management','£27,000',27000,'GBP','year','2027-01-31',70,6.5,array['Passport','transcript','IELTS','personal statement'],'assignment_example'),
 ('CA-TOR-CS','University of Toronto','Canada','BSc Computer Science','CAD 60,000',60000,'CAD','year','2027-01-15',80,6.5,array['Passport','transcript','IELTS'],'assignment_example'),
 ('DE-TUM-INF','TU Munich','Germany','BSc Informatics','No tuition (about €150 a term)',150,'EUR','term','2027-07-15',70,6.5,array['Passport','transcript','IELTS'],'assignment_example'),
 ('AU-MON-IT','Monash University','Australia','Bachelor of IT','AUD 48,000',48000,'AUD','year','2026-11-30',70,6.0,array['Passport','transcript','IELTS'],'assignment_example'),
 ('UK-NOT-DS','University of Nottingham','UK','BSc Data Science','£28,500',28500,'GBP','year','2027-02-15',72,6.5,array['Passport','transcript','IELTS'],'additional_fictional_practice'),
 ('UK-SHE-ENG','University of Sheffield','UK','BEng Mechanical Engineering','£29,000',29000,'GBP','year','2027-02-28',75,6.5,array['Passport','transcript','IELTS','personal statement'],'additional_fictional_practice'),
 ('CA-ALB-BA','University of Alberta','Canada','Bachelor of Business Administration','CAD 35,000',35000,'CAD','year','2027-03-01',75,6.5,array['Passport','transcript','IELTS'],'additional_fictional_practice'),
 ('CA-OTT-SE','University of Ottawa','Canada','BSc Software Engineering','CAD 42,000',42000,'CAD','year','2027-02-01',78,6.5,array['Passport','transcript','IELTS'],'additional_fictional_practice'),
 ('CA-MAN-CS','University of Manitoba','Canada','BSc Computer Science','CAD 30,000',30000,'CAD','year','2027-03-15',70,6.5,array['Passport','transcript','IELTS'],'additional_fictional_practice'),
 ('DE-HAM-DS','University of Hamburg','Germany','BSc Data Science','No tuition (about €340 a term)',340,'EUR','term','2027-07-01',72,6.5,array['Passport','transcript','IELTS'],'additional_fictional_practice'),
 ('DE-BER-BA','Humboldt University of Berlin','Germany','BSc Business Administration','No tuition (about €315 a term)',315,'EUR','term','2027-07-15',70,6.5,array['Passport','transcript','IELTS','personal statement'],'additional_fictional_practice'),
 ('DE-BON-CS','University of Bonn','Germany','BSc Computer Science','No tuition (about €330 a term)',330,'EUR','term','2027-06-30',73,6.5,array['Passport','transcript','IELTS'],'additional_fictional_practice'),
 ('AU-DEAK-CS','Deakin University','Australia','Bachelor of Computer Science','AUD 38,000',38000,'AUD','year','2026-12-15',65,6.0,array['Passport','transcript','IELTS'],'additional_fictional_practice'),
 ('AU-RMIT-BUS','RMIT University','Australia','Bachelor of Business','AUD 40,000',40000,'AUD','year','2027-01-10',68,6.5,array['Passport','transcript','IELTS','personal statement'],'additional_fictional_practice')
on conflict (program_code) do nothing;

insert into public.leads (full_name, phone, normalized_phone, preferred_country, marks, ielts_status, ielts_score, last_reply_at, is_test)
values
 ('Ali Khan','0301 2345678','+923012345678','UK',78,'taken',6.5,now(),true),
 ('Ayesha Noor','0333 9876543','+923339876543','Canada',85,'taken',7.0,now(),true),
 ('Hamza Iqbal','0346 2223344','+923462223344','UK',69,'not_taken',null,now()-interval '4 days',true)
on conflict (normalized_phone) do nothing;

insert into public.app_settings (key,value,description) values
 ('practice_mode','true'::jsonb,'Programs are fictional training data.'),
 ('approval_required','true'::jsonb,'Staff approval is required for every student-facing message.'),
 ('followup_inactivity_days','3'::jsonb,'Proposed demo threshold.'),
 ('office_timezone','"Asia/Karachi"'::jsonb,'Nowshera office display timezone.'),
 ('delivery_enabled','false'::jsonb,'No external delivery is connected.'),
 ('allowed_delivery_channels','["test_chat"]'::jsonb,'Only local test chat delivery is available.')
on conflict (key) do nothing;
