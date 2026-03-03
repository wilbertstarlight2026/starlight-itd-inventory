-- ============================================================
-- Starlight ITD Inventory — Dummy Data (portable — no hardcoded UUIDs)
-- ============================================================

-- ─── USERS ───────────────────────────────────────────────────
DO $$
DECLARE
  it_dept   UUID;
  fin_dept  UUID;
  hr_dept   UUID;
  ops_dept  UUID;
  sal_dept  UUID;
  mgt_dept  UUID;
  -- bcrypt hash for "Password@123"
  pw        TEXT := '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCBEfubHqNXHbD4F5DkrUJm';
BEGIN
  SELECT id INTO it_dept  FROM departments WHERE name = 'IT Department' LIMIT 1;
  SELECT id INTO fin_dept FROM departments WHERE name = 'Finance'       LIMIT 1;
  SELECT id INTO hr_dept  FROM departments WHERE name = 'HR'            LIMIT 1;
  SELECT id INTO ops_dept FROM departments WHERE name = 'Operations'    LIMIT 1;
  SELECT id INTO sal_dept FROM departments WHERE name = 'Sales'         LIMIT 1;
  SELECT id INTO mgt_dept FROM departments WHERE name = 'Management'    LIMIT 1;

  INSERT INTO users (name, email, password_hash, role, department_id, is_active) VALUES
    ('Maria Santos',    'maria.santos@starlight.com',  pw, 'manager', fin_dept, true),
    ('Juan dela Cruz',  'juan.delacruz@starlight.com', pw, 'manager', hr_dept,  true),
    ('Ana Reyes',       'ana.reyes@starlight.com',     pw, 'manager', it_dept,  true),
    ('Carlos Mendoza',  'carlos.mendoza@starlight.com',pw, 'user',    ops_dept, true),
    ('Rose Garcia',     'rose.garcia@starlight.com',   pw, 'user',    sal_dept, true),
    ('Michael Tan',     'michael.tan@starlight.com',   pw, 'user',    it_dept,  true),
    ('Liza Cruz',       'liza.cruz@starlight.com',     pw, 'user',    fin_dept, true),
    ('Paolo Bautista',  'paolo.bautista@starlight.com',pw, 'user',    ops_dept, true),
    ('Jenny Villanueva','jenny.villanueva@starlight.com',pw,'user',   hr_dept,  true),
    ('Robert Lim',      'robert.lim@starlight.com',    pw, 'user',    mgt_dept, true)
  ON CONFLICT (email) DO NOTHING;
END $$;

-- ─── ITEMS ───────────────────────────────────────────────────
DO $$
DECLARE
  admin_id  UUID;
  -- categories (looked up by name)
  c_laptop  UUID;
  c_desktop UUID;
  c_server  UUID;
  c_monitor UUID;
  c_keyboard UUID;
  c_mouse   UUID;
  c_router  UUID;
  c_switch  UUID;
  c_ap      UUID;
  c_laser   UUID;
  c_inkjet  UUID;
  c_mfp     UUID;
  c_proj    UUID;
  c_webcam  UUID;
  c_tablet  UUID;
  c_accry   UUID;
  c_spare   UUID;
  c_office  UUID;
BEGIN
  SELECT id INTO admin_id  FROM users      WHERE email = 'admin@starlight.com' LIMIT 1;
  SELECT id INTO c_laptop  FROM categories WHERE name = 'Laptop'         LIMIT 1;
  SELECT id INTO c_desktop FROM categories WHERE name = 'Desktop'        LIMIT 1;
  SELECT id INTO c_server  FROM categories WHERE name = 'Server'         LIMIT 1;
  SELECT id INTO c_monitor FROM categories WHERE name = 'Monitor'        LIMIT 1;
  SELECT id INTO c_keyboard FROM categories WHERE name = 'Keyboard'      LIMIT 1;
  SELECT id INTO c_mouse   FROM categories WHERE name = 'Mouse'          LIMIT 1;
  SELECT id INTO c_router  FROM categories WHERE name = 'Router'         LIMIT 1;
  SELECT id INTO c_switch  FROM categories WHERE name = 'Switch'         LIMIT 1;
  SELECT id INTO c_ap      FROM categories WHERE name = 'Access Point'   LIMIT 1;
  SELECT id INTO c_laser   FROM categories WHERE name = 'Laser Printer'  LIMIT 1;
  SELECT id INTO c_inkjet  FROM categories WHERE name = 'Inkjet Printer' LIMIT 1;
  SELECT id INTO c_mfp     FROM categories WHERE name = 'MFP'            LIMIT 1;
  SELECT id INTO c_proj    FROM categories WHERE name = 'Projector'      LIMIT 1;
  SELECT id INTO c_webcam  FROM categories WHERE name = 'Webcam'         LIMIT 1;
  SELECT id INTO c_tablet  FROM categories WHERE name = 'Tablet'         LIMIT 1;
  SELECT id INTO c_accry   FROM categories WHERE name = 'Accessories'    LIMIT 1;
  SELECT id INTO c_spare   FROM categories WHERE name = 'Spare Parts'    LIMIT 1;
  SELECT id INTO c_office  FROM categories WHERE name = 'Office Supplies' LIMIT 1;

  INSERT INTO items
    (item_code, name, description, category_id, brand, model, serial_number, barcode, qr_code,
     purchase_date, purchase_price, warranty_expiry, status, condition, notes, created_by)
  VALUES
  -- ── Laptops ──────────────────────────────────────────────
  ('IT-LAP-001','Laptop Dell Latitude 5540','14" Business Laptop',c_laptop,'Dell','Latitude 5540','SN-DLL-001','8901234560001','{"type":"item","code":"IT-LAP-001"}','2023-06-15',65000.00,'2026-06-15','in_use','good','Assigned to Finance Manager',admin_id),
  ('IT-LAP-002','Laptop Dell Latitude 5540','14" Business Laptop',c_laptop,'Dell','Latitude 5540','SN-DLL-002','8901234560002','{"type":"item","code":"IT-LAP-002"}','2023-06-15',65000.00,'2026-06-15','in_use','good','Assigned to HR Manager',admin_id),
  ('IT-LAP-003','Laptop Lenovo ThinkPad E14','14" Business Laptop',c_laptop,'Lenovo','ThinkPad E14 Gen4','SN-LNV-003','8901234560003','{"type":"item","code":"IT-LAP-003"}','2023-09-01',58000.00,'2026-09-01','in_use','good','Assigned to IT Staff',admin_id),
  ('IT-LAP-004','Laptop Lenovo ThinkPad E14','14" Business Laptop',c_laptop,'Lenovo','ThinkPad E14 Gen4','SN-LNV-004','8901234560004','{"type":"item","code":"IT-LAP-004"}','2023-09-01',58000.00,'2026-09-01','available','good','Spare unit',admin_id),
  ('IT-LAP-005','Laptop HP EliteBook 840','14" Business Laptop',c_laptop,'HP','EliteBook 840 G9','SN-HP-005','8901234560005','{"type":"item","code":"IT-LAP-005"}','2022-11-20',72000.00,'2025-11-20','under_repair','fair','Screen hinge issue',admin_id),
  ('IT-LAP-006','Laptop MacBook Air M2','13.6" Apple Laptop',c_laptop,'Apple','MacBook Air M2','SN-APL-006','8901234560006','{"type":"item","code":"IT-LAP-006"}','2024-01-10',89000.00,'2027-01-10','in_use','new','For Management use',admin_id),

  -- ── Desktops ─────────────────────────────────────────────
  ('IT-DES-001','Desktop Dell OptiPlex 3000','Tower Desktop PC',c_desktop,'Dell','OptiPlex 3000','SN-DOP-001','8901234561001','{"type":"item","code":"IT-DES-001"}','2022-03-10',38000.00,'2025-03-10','in_use','good','Finance department workstation',admin_id),
  ('IT-DES-002','Desktop Dell OptiPlex 3000','Tower Desktop PC',c_desktop,'Dell','OptiPlex 3000','SN-DOP-002','8901234561002','{"type":"item","code":"IT-DES-002"}','2022-03-10',38000.00,'2025-03-10','in_use','good','Finance department workstation',admin_id),
  ('IT-DES-003','Desktop Lenovo ThinkCentre M70s','Small Form Factor',c_desktop,'Lenovo','ThinkCentre M70s','SN-LTC-003','8901234561003','{"type":"item","code":"IT-DES-003"}','2022-07-22',35000.00,'2025-07-22','in_use','good','HR workstation',admin_id),
  ('IT-DES-004','Desktop Lenovo ThinkCentre M70s','Small Form Factor',c_desktop,'Lenovo','ThinkCentre M70s','SN-LTC-004','8901234561004','{"type":"item","code":"IT-DES-004"}','2022-07-22',35000.00,'2025-07-22','available','fair','In storage',admin_id),
  ('IT-DES-005','Desktop HP ProDesk 400 G9','Compact Desktop',c_desktop,'HP','ProDesk 400 G9','SN-HPD-005','8901234561005','{"type":"item","code":"IT-DES-005"}','2023-01-15',42000.00,'2026-01-15','in_use','good','Operations workstation',admin_id),

  -- ── Servers ──────────────────────────────────────────────
  ('IT-SRV-001','Server Dell PowerEdge T40','Tower Server',c_server,'Dell','PowerEdge T40','SN-DPS-001','8901234562001','{"type":"item","code":"IT-SRV-001"}','2021-08-05',145000.00,'2024-08-05','in_use','good','Primary file server',admin_id),
  ('IT-SRV-002','Server HP ProLiant ML110','Tower Server',c_server,'HP','ProLiant ML110 Gen10','SN-HPP-002','8901234562002','{"type":"item","code":"IT-SRV-002"}','2022-02-18',168000.00,'2025-02-18','in_use','good','Backup server',admin_id),

  -- ── Monitors ─────────────────────────────────────────────
  ('IT-MON-001','Monitor Dell 24" P2422H','24" FHD IPS Monitor',c_monitor,'Dell','P2422H','SN-DMN-001','8901234563001','{"type":"item","code":"IT-MON-001"}','2022-03-10',14500.00,'2025-03-10','in_use','good',NULL,admin_id),
  ('IT-MON-002','Monitor Dell 24" P2422H','24" FHD IPS Monitor',c_monitor,'Dell','P2422H','SN-DMN-002','8901234563002','{"type":"item","code":"IT-MON-002"}','2022-03-10',14500.00,'2025-03-10','in_use','good',NULL,admin_id),
  ('IT-MON-003','Monitor LG 27" 27MK430H','27" FHD Monitor',c_monitor,'LG','27MK430H','SN-LGM-003','8901234563003','{"type":"item","code":"IT-MON-003"}','2023-05-08',12800.00,'2026-05-08','in_use','good',NULL,admin_id),
  ('IT-MON-004','Monitor LG 27" 27MK430H','27" FHD Monitor',c_monitor,'LG','27MK430H','SN-LGM-004','8901234563004','{"type":"item","code":"IT-MON-004"}','2023-05-08',12800.00,'2026-05-08','available','good','Spare monitor',admin_id),
  ('IT-MON-005','Monitor AOC 22" 22B2HM','22" FHD Monitor',c_monitor,'AOC','22B2HM','SN-AOC-005','8901234563005','{"type":"item","code":"IT-MON-005"}','2021-09-14',8500.00,'2024-09-14','in_use','fair','Minor scratches on bezel',admin_id),

  -- ── Network Equipment ─────────────────────────────────────
  ('IT-RTR-001','Router Cisco RV340','Dual WAN Router',c_router,'Cisco','RV340','SN-CSR-001','8901234564001','{"type":"item","code":"IT-RTR-001"}','2021-06-20',28000.00,'2024-06-20','in_use','good','Main office router',admin_id),
  ('IT-RTR-002','Router Mikrotik RB4011','Multi-port Router',c_router,'Mikrotik','RB4011iGS+RM','SN-MKT-002','8901234564002','{"type":"item","code":"IT-RTR-002"}','2022-11-10',18500.00,'2025-11-10','available','good','Backup router',admin_id),
  ('IT-SWT-001','Switch Cisco SG350-28','28-Port Gigabit Switch',c_switch,'Cisco','SG350-28','SN-CSW-001','8901234564101','{"type":"item","code":"IT-SWT-001"}','2021-06-20',32000.00,'2024-06-20','in_use','good','Server room core switch',admin_id),
  ('IT-SWT-002','Switch TP-Link TL-SG1024','24-Port Gigabit Switch',c_switch,'TP-Link','TL-SG1024','SN-TPL-002','8901234564102','{"type":"item","code":"IT-SWT-002"}','2022-04-05',6800.00,'2025-04-05','in_use','good','Floor 1 access switch',admin_id),
  ('IT-SWT-003','Switch TP-Link TL-SG1024','24-Port Gigabit Switch',c_switch,'TP-Link','TL-SG1024','SN-TPL-003','8901234564103','{"type":"item","code":"IT-SWT-003"}','2022-04-05',6800.00,'2025-04-05','in_use','good','Floor 2 access switch',admin_id),
  ('IT-WAP-001','Access Point Ubiquiti U6-LR','WiFi 6 Long Range AP',c_ap,'Ubiquiti','U6-LR','SN-UBI-001','8901234564201','{"type":"item","code":"IT-WAP-001"}','2023-03-01',9800.00,'2026-03-01','in_use','good','Floor 1 wireless coverage',admin_id),
  ('IT-WAP-002','Access Point Ubiquiti U6-LR','WiFi 6 Long Range AP',c_ap,'Ubiquiti','U6-LR','SN-UBI-002','8901234564202','{"type":"item","code":"IT-WAP-002"}','2023-03-01',9800.00,'2026-03-01','in_use','good','Floor 2 wireless coverage',admin_id),

  -- ── Printers ─────────────────────────────────────────────
  ('IT-PRN-001','Printer HP LaserJet M404dn','Mono Laser Printer',c_laser,'HP','LaserJet M404dn','SN-HPL-001','8901234565001','{"type":"item","code":"IT-PRN-001"}','2022-06-10',24500.00,'2025-06-10','in_use','good','Finance floor printer',admin_id),
  ('IT-PRN-002','Printer Canon iR-ADV C3530','Color MFP A3',c_mfp,'Canon','iR-ADV C3530','SN-CAN-002','8901234565002','{"type":"item","code":"IT-PRN-002"}','2021-10-15',185000.00,'2024-10-15','in_use','fair','Main office MFP — toner low',admin_id),
  ('IT-PRN-003','Printer Epson L3210','Color Inkjet MFP',c_inkjet,'Epson','L3210','SN-EPS-003','8901234565003','{"type":"item","code":"IT-PRN-003"}','2023-02-20',8900.00,'2026-02-20','in_use','good','HR office printer',admin_id),

  -- ── Projectors ───────────────────────────────────────────
  ('IT-PRJ-001','Projector Epson EB-X51','XGA LCD Projector 3800lm',c_proj,'Epson','EB-X51','SN-EPP-001','8901234566001','{"type":"item","code":"IT-PRJ-001"}','2022-08-25',35000.00,'2025-08-25','available','good','Conference Room A projector',admin_id),
  ('IT-PRJ-002','Projector BenQ MH560','1080p DLP Projector 4000lm',c_proj,'BenQ','MH560','SN-BNQ-002','8901234566002','{"type":"item","code":"IT-PRJ-002"}','2023-07-12',28500.00,'2026-07-12','in_use','good','Conference Room B projector',admin_id),

  -- ── Peripherals ──────────────────────────────────────────
  ('IT-KBD-001','Keyboard Logitech MK270','Wireless Keyboard',c_keyboard,'Logitech','MK270','SN-LGK-001','8901234567001','{"type":"item","code":"IT-KBD-001"}','2023-01-10',1200.00,'2025-01-10','in_use','good',NULL,admin_id),
  ('IT-KBD-002','Keyboard Logitech MK270','Wireless Keyboard',c_keyboard,'Logitech','MK270','SN-LGK-002','8901234567002','{"type":"item","code":"IT-KBD-002"}','2023-01-10',1200.00,'2025-01-10','in_use','good',NULL,admin_id),
  ('IT-MSE-001','Mouse Logitech M330','Silent Wireless Mouse',c_mouse,'Logitech','M330 Silent Plus','SN-LGM-001','8901234567101','{"type":"item","code":"IT-MSE-001"}','2023-01-10',950.00,'2025-01-10','in_use','good',NULL,admin_id),
  ('IT-MSE-002','Mouse Logitech M330','Silent Wireless Mouse',c_mouse,'Logitech','M330 Silent Plus','SN-LGM-002','8901234567102','{"type":"item","code":"IT-MSE-002"}','2023-01-10',950.00,'2025-01-10','in_use','good',NULL,admin_id),
  ('IT-WCM-001','Webcam Logitech C920','Full HD 1080p Webcam',c_webcam,'Logitech','C920 HD Pro','SN-LGW-001','8901234567201','{"type":"item","code":"IT-WCM-001"}','2023-04-18',3800.00,'2025-04-18','in_use','good','For video conferencing',admin_id),
  ('IT-WCM-002','Webcam Logitech C920','Full HD 1080p Webcam',c_webcam,'Logitech','C920 HD Pro','SN-LGW-002','8901234567202','{"type":"item","code":"IT-WCM-002"}','2023-04-18',3800.00,'2025-04-18','available','good','Spare unit',admin_id),

  -- ── Tablets ──────────────────────────────────────────────
  ('IT-TAB-001','Tablet Samsung Galaxy Tab S8','11" Android Tablet',c_tablet,'Samsung','Galaxy Tab S8','SN-SAM-001','8901234568001','{"type":"item","code":"IT-TAB-001"}','2023-08-01',32000.00,'2026-08-01','in_use','new','Field operations tablet',admin_id),
  ('IT-TAB-002','Tablet Samsung Galaxy Tab S8','11" Android Tablet',c_tablet,'Samsung','Galaxy Tab S8','SN-SAM-002','8901234568002','{"type":"item","code":"IT-TAB-002"}','2023-08-01',32000.00,'2026-08-01','available','new','Field operations tablet',admin_id),

  -- ── Accessories / Spare Parts ─────────────────────────────
  ('IT-ACY-001','UPS APC Back-UPS 1500VA','1500VA 230V UPS',c_accry,'APC','Back-UPS BX1500M','SN-APC-001','8901234569001','{"type":"item","code":"IT-ACY-001"}','2021-06-20',15800.00,'2024-06-20','in_use','fair','Server room UPS',admin_id),
  ('IT-ACY-002','UPS APC Back-UPS 850VA','850VA 230V UPS',c_accry,'APC','Back-UPS BX850M','SN-APC-002','8901234569002','{"type":"item","code":"IT-ACY-002"}','2022-09-05',6500.00,'2025-09-05','in_use','good','Finance server UPS',admin_id),
  ('IT-SPR-001','RAM DDR4 16GB Kingston','16GB DDR4 3200MHz DIMM',c_spare,'Kingston','KVR32N22D8/16','SN-KNG-001','8901234569101','{"type":"item","code":"IT-SPR-001"}','2023-11-15',3200.00,'2026-11-15','available','new','Spare memory for desktops',admin_id),
  ('IT-SPR-002','SSD 512GB Samsung 870 EVO','2.5" SATA SSD',c_spare,'Samsung','870 EVO','SN-SSD-001','8901234569102','{"type":"item","code":"IT-SPR-002"}','2023-11-15',5800.00,'2026-11-15','available','new','Spare storage',admin_id),
  ('IT-SPR-003','Power Supply 650W Corsair','650W 80+ Bronze PSU',c_spare,'Corsair','CX650M','SN-COR-001','8901234569103','{"type":"item","code":"IT-SPR-003"}','2022-05-20',4200.00,'2025-05-20','available','good','Spare PSU',admin_id),

  -- ── Disposed / Retired ────────────────────────────────────
  ('IT-LAP-OLD1','Laptop HP ProBook 450 G3','Old Laptop (Retired)',c_laptop,'HP','ProBook 450 G3','SN-HPB-OLD1','8901234560101','{"type":"item","code":"IT-LAP-OLD1"}','2018-01-10',42000.00,'2021-01-10','disposed','poor','End of life — disposed Jan 2024',admin_id),
  ('IT-DES-OLD1','Desktop Acer Veriton X4640G','Old Desktop (Retired)',c_desktop,'Acer','Veriton X4640G','SN-ACR-OLD1','8901234561101','{"type":"item","code":"IT-DES-OLD1"}','2017-05-15',28000.00,'2020-05-15','retired','poor','Replaced by newer units',admin_id);

END $$;

-- ─── ASSIGNMENTS ─────────────────────────────────────────────
DO $$
DECLARE
  admin_id    UUID;
  maria_id    UUID;
  juan_id     UUID;
  ana_id      UUID;
  carlos_id   UUID;
  rose_id     UUID;
  michael_id  UUID;
  liza_id     UUID;
  paolo_id    UUID;
  jenny_id    UUID;
  robert_id   UUID;

  -- locations (looked up by name)
  loc_it      UUID;
  loc_confa   UUID;
  loc_confb   UUID;
  loc_fin     UUID;
  loc_hr      UUID;
  loc_srv     UUID;

  -- departments (looked up by name)
  dep_it      UUID;
  dep_fin     UUID;
  dep_hr      UUID;
  dep_ops     UUID;
  dep_sal     UUID;
  dep_mgt     UUID;

  -- item ids (looked up by item_code)
  item_lap001 UUID; item_lap002 UUID; item_lap003 UUID; item_lap006 UUID;
  item_des001 UUID; item_des002 UUID; item_des003 UUID; item_des005 UUID;
  item_srv001 UUID; item_srv002 UUID;
  item_mon001 UUID; item_mon002 UUID; item_mon003 UUID; item_mon005 UUID;
  item_prn001 UUID; item_prn002 UUID; item_prn003 UUID;
  item_prj001 UUID; item_prj002 UUID;
  item_rtr001 UUID; item_swt001 UUID; item_swt002 UUID; item_swt003 UUID;
  item_wap001 UUID; item_wap002 UUID;
  item_kbd001 UUID; item_kbd002 UUID;
  item_mse001 UUID; item_mse002 UUID;
  item_wcm001 UUID;
  item_tab001 UUID;
  item_ups001 UUID; item_ups002 UUID;
BEGIN
  -- users
  SELECT id INTO admin_id   FROM users WHERE email = 'admin@starlight.com';
  SELECT id INTO maria_id   FROM users WHERE email = 'maria.santos@starlight.com';
  SELECT id INTO juan_id    FROM users WHERE email = 'juan.delacruz@starlight.com';
  SELECT id INTO ana_id     FROM users WHERE email = 'ana.reyes@starlight.com';
  SELECT id INTO carlos_id  FROM users WHERE email = 'carlos.mendoza@starlight.com';
  SELECT id INTO rose_id    FROM users WHERE email = 'rose.garcia@starlight.com';
  SELECT id INTO michael_id FROM users WHERE email = 'michael.tan@starlight.com';
  SELECT id INTO liza_id    FROM users WHERE email = 'liza.cruz@starlight.com';
  SELECT id INTO paolo_id   FROM users WHERE email = 'paolo.bautista@starlight.com';
  SELECT id INTO jenny_id   FROM users WHERE email = 'jenny.villanueva@starlight.com';
  SELECT id INTO robert_id  FROM users WHERE email = 'robert.lim@starlight.com';

  -- locations
  SELECT id INTO loc_it    FROM locations WHERE name = 'IT Room'           LIMIT 1;
  SELECT id INTO loc_confa FROM locations WHERE name = 'Conference Room A' LIMIT 1;
  SELECT id INTO loc_confb FROM locations WHERE name = 'Conference Room B' LIMIT 1;
  SELECT id INTO loc_fin   FROM locations WHERE name = 'Finance Office'    LIMIT 1;
  SELECT id INTO loc_hr    FROM locations WHERE name = 'HR Office'         LIMIT 1;
  SELECT id INTO loc_srv   FROM locations WHERE name = 'Server Room'       LIMIT 1;

  -- departments
  SELECT id INTO dep_it  FROM departments WHERE name = 'IT Department' LIMIT 1;
  SELECT id INTO dep_fin FROM departments WHERE name = 'Finance'       LIMIT 1;
  SELECT id INTO dep_hr  FROM departments WHERE name = 'HR'            LIMIT 1;
  SELECT id INTO dep_ops FROM departments WHERE name = 'Operations'    LIMIT 1;
  SELECT id INTO dep_sal FROM departments WHERE name = 'Sales'         LIMIT 1;
  SELECT id INTO dep_mgt FROM departments WHERE name = 'Management'    LIMIT 1;

  -- items
  SELECT id INTO item_lap001 FROM items WHERE item_code = 'IT-LAP-001';
  SELECT id INTO item_lap002 FROM items WHERE item_code = 'IT-LAP-002';
  SELECT id INTO item_lap003 FROM items WHERE item_code = 'IT-LAP-003';
  SELECT id INTO item_lap006 FROM items WHERE item_code = 'IT-LAP-006';
  SELECT id INTO item_des001 FROM items WHERE item_code = 'IT-DES-001';
  SELECT id INTO item_des002 FROM items WHERE item_code = 'IT-DES-002';
  SELECT id INTO item_des003 FROM items WHERE item_code = 'IT-DES-003';
  SELECT id INTO item_des005 FROM items WHERE item_code = 'IT-DES-005';
  SELECT id INTO item_srv001 FROM items WHERE item_code = 'IT-SRV-001';
  SELECT id INTO item_srv002 FROM items WHERE item_code = 'IT-SRV-002';
  SELECT id INTO item_mon001 FROM items WHERE item_code = 'IT-MON-001';
  SELECT id INTO item_mon002 FROM items WHERE item_code = 'IT-MON-002';
  SELECT id INTO item_mon003 FROM items WHERE item_code = 'IT-MON-003';
  SELECT id INTO item_mon005 FROM items WHERE item_code = 'IT-MON-005';
  SELECT id INTO item_prn001 FROM items WHERE item_code = 'IT-PRN-001';
  SELECT id INTO item_prn002 FROM items WHERE item_code = 'IT-PRN-002';
  SELECT id INTO item_prn003 FROM items WHERE item_code = 'IT-PRN-003';
  SELECT id INTO item_prj001 FROM items WHERE item_code = 'IT-PRJ-001';
  SELECT id INTO item_prj002 FROM items WHERE item_code = 'IT-PRJ-002';
  SELECT id INTO item_rtr001 FROM items WHERE item_code = 'IT-RTR-001';
  SELECT id INTO item_swt001 FROM items WHERE item_code = 'IT-SWT-001';
  SELECT id INTO item_swt002 FROM items WHERE item_code = 'IT-SWT-002';
  SELECT id INTO item_swt003 FROM items WHERE item_code = 'IT-SWT-003';
  SELECT id INTO item_wap001 FROM items WHERE item_code = 'IT-WAP-001';
  SELECT id INTO item_wap002 FROM items WHERE item_code = 'IT-WAP-002';
  SELECT id INTO item_kbd001 FROM items WHERE item_code = 'IT-KBD-001';
  SELECT id INTO item_kbd002 FROM items WHERE item_code = 'IT-KBD-002';
  SELECT id INTO item_mse001 FROM items WHERE item_code = 'IT-MSE-001';
  SELECT id INTO item_mse002 FROM items WHERE item_code = 'IT-MSE-002';
  SELECT id INTO item_wcm001 FROM items WHERE item_code = 'IT-WCM-001';
  SELECT id INTO item_tab001 FROM items WHERE item_code = 'IT-TAB-001';
  SELECT id INTO item_ups001 FROM items WHERE item_code = 'IT-ACY-001';
  SELECT id INTO item_ups002 FROM items WHERE item_code = 'IT-ACY-002';

  INSERT INTO assignments (item_id, employee_id, department_id, location_id, assigned_by, assigned_at, notes) VALUES
  -- Laptops
  (item_lap001, maria_id,   dep_fin, loc_fin,  admin_id, '2023-06-20 08:00:00', 'Assigned to Finance Manager'),
  (item_lap002, juan_id,    dep_hr,  loc_hr,   admin_id, '2023-06-20 08:30:00', 'Assigned to HR Manager'),
  (item_lap003, michael_id, dep_it,  loc_it,   admin_id, '2023-09-05 09:00:00', 'Assigned to IT Staff'),
  (item_lap006, robert_id,  dep_mgt, loc_srv,  admin_id, '2024-01-15 09:00:00', 'Assigned to Management'),
  -- Desktops
  (item_des001, liza_id,    dep_fin, loc_fin,  admin_id, '2022-03-15 08:00:00', 'Finance workstation 1'),
  (item_des002, maria_id,   dep_fin, loc_fin,  admin_id, '2022-03-15 08:00:00', 'Finance workstation 2'),
  (item_des003, jenny_id,   dep_hr,  loc_hr,   admin_id, '2022-07-25 08:00:00', 'HR workstation'),
  (item_des005, carlos_id,  dep_ops, loc_confa,admin_id, '2023-01-20 08:00:00', 'Operations workstation'),
  -- Servers
  (item_srv001, admin_id,   dep_it,  loc_srv,  admin_id, '2021-08-10 08:00:00', 'Primary file server in server room'),
  (item_srv002, admin_id,   dep_it,  loc_srv,  admin_id, '2022-02-20 08:00:00', 'Backup server in server room'),
  -- Monitors
  (item_mon001, maria_id,   dep_fin, loc_fin,  admin_id, '2022-03-15 09:00:00', 'Finance workstation monitor'),
  (item_mon002, liza_id,    dep_fin, loc_fin,  admin_id, '2022-03-15 09:00:00', 'Finance workstation monitor'),
  (item_mon003, michael_id, dep_it,  loc_it,   admin_id, '2023-05-10 09:00:00', 'IT workstation monitor'),
  (item_mon005, carlos_id,  dep_ops, loc_confa,admin_id, '2021-09-15 09:00:00', 'Operations workstation monitor'),
  -- Network
  (item_rtr001, admin_id,   dep_it,  loc_srv,  admin_id, '2021-06-25 10:00:00', 'Core router in server room'),
  (item_swt001, admin_id,   dep_it,  loc_srv,  admin_id, '2021-06-25 10:00:00', 'Core switch in server room'),
  (item_swt002, admin_id,   dep_it,  loc_confa,admin_id, '2022-04-10 10:00:00', 'Floor 1 switch'),
  (item_swt003, admin_id,   dep_it,  loc_confb,admin_id, '2022-04-10 10:00:00', 'Floor 2 switch'),
  (item_wap001, admin_id,   dep_it,  loc_confa,admin_id, '2023-03-05 10:00:00', 'Floor 1 wireless AP'),
  (item_wap002, admin_id,   dep_it,  loc_confb,admin_id, '2023-03-05 10:00:00', 'Floor 2 wireless AP'),
  -- Printers
  (item_prn001, NULL,       dep_fin, loc_fin,  admin_id, '2022-06-15 08:00:00', 'Shared finance floor printer'),
  (item_prn002, NULL,       dep_it,  loc_it,   admin_id, '2021-10-20 08:00:00', 'Shared main office MFP'),
  (item_prn003, NULL,       dep_hr,  loc_hr,   admin_id, '2023-02-25 08:00:00', 'Shared HR office printer'),
  -- Projectors
  (item_prj001, NULL,       dep_it,  loc_confa,admin_id, '2022-08-30 08:00:00', 'Conference Room A projector'),
  (item_prj002, NULL,       dep_it,  loc_confb,admin_id, '2023-07-15 08:00:00', 'Conference Room B projector'),
  -- Peripherals
  (item_kbd001, carlos_id,  dep_ops, loc_confa,admin_id, '2023-01-12 08:00:00', 'Operations keyboard'),
  (item_kbd002, paolo_id,   dep_ops, loc_confa,admin_id, '2023-01-12 08:00:00', 'Operations keyboard'),
  (item_mse001, carlos_id,  dep_ops, loc_confa,admin_id, '2023-01-12 08:00:00', 'Operations mouse'),
  (item_mse002, paolo_id,   dep_ops, loc_confa,admin_id, '2023-01-12 08:00:00', 'Operations mouse'),
  (item_wcm001, ana_id,     dep_it,  loc_it,   admin_id, '2023-04-20 08:00:00', 'IT Manager webcam for meetings'),
  -- Tablets
  (item_tab001, rose_id,    dep_sal, loc_confa,admin_id, '2023-08-05 08:00:00', 'Sales field tablet'),
  -- UPS
  (item_ups001, admin_id,   dep_it,  loc_srv,  admin_id, '2021-06-25 08:00:00', 'Server room UPS protection'),
  (item_ups002, admin_id,   dep_fin, loc_fin,  admin_id, '2022-09-10 08:00:00', 'Finance server UPS');

END $$;

-- ─── AUDIT LOG ENTRIES ────────────────────────────────────────
DO $$
DECLARE
  admin_id UUID;
  ana_id   UUID;
BEGIN
  SELECT id INTO admin_id FROM users WHERE email = 'admin@starlight.com';
  SELECT id INTO ana_id   FROM users WHERE email = 'ana.reyes@starlight.com';

  INSERT INTO audit_log (entity_type, entity_id, action, new_value, performed_by, performed_at) VALUES
  ('item', (SELECT id FROM items WHERE item_code='IT-LAP-001'), 'create',
   '{"item_code":"IT-LAP-001","name":"Laptop Dell Latitude 5540"}'::jsonb, admin_id, '2023-06-15 08:00:00'),
  ('item', (SELECT id FROM items WHERE item_code='IT-SRV-001'), 'create',
   '{"item_code":"IT-SRV-001","name":"Server Dell PowerEdge T40"}'::jsonb, admin_id, '2021-08-05 08:00:00'),
  ('item', (SELECT id FROM items WHERE item_code='IT-LAP-OLD1'), 'delete',
   '{"item_code":"IT-LAP-OLD1","reason":"End of life"}'::jsonb, admin_id, '2024-01-15 10:00:00'),
  ('item', (SELECT id FROM items WHERE item_code='IT-LAP-005'), 'update',
   '{"status":"under_repair","notes":"Screen hinge issue sent to service center"}'::jsonb, ana_id, '2024-11-10 14:00:00'),
  ('user', admin_id, 'login', NULL, admin_id, NOW() - INTERVAL '2 hours');
END $$;
