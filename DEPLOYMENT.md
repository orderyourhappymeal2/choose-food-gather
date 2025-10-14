# คู่มือการ Deploy และ Migration ระบบสั่งอาหาร

## สารบัญ
1. [การติดตั้ง Docker](#1-การติดตั้ง-docker)
2. [การติดตั้ง Local Supabase](#2-การติดตั้ง-local-supabase)
3. [การ Migration ข้อมูลจาก Supabase Cloud](#3-การ-migration-ข้อมูลจาก-supabase-cloud)
4. [การ Deploy Web Application](#4-การ-deploy-web-application)
5. [การตรวจสอบและแก้ไขปัญหา](#5-การตรวจสอบและแก้ไขปัญหา)

---

## 1. การติดตั้ง Docker

### 1.1 ติดตั้ง Docker บน Ubuntu/Debian

```bash
# อัพเดทแพ็คเกจ
sudo apt-get update
```

**Output ที่คาดหวัง:**
```
Hit:1 http://archive.ubuntu.com/ubuntu jammy InRelease
Get:2 http://security.ubuntu.com/ubuntu jammy-security InRelease [110 kB]
...
Reading package lists... Done
```

```bash
# ติดตั้งแพ็คเกจที่จำเป็น
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release
```

**Output ที่คาดหวัง:**
```
Reading package lists... Done
Building dependency tree... Done
...
ca-certificates is already the newest version
curl is already the newest version
...
```

```bash
# เพิ่ม Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
```

```bash
# ตั้งค่า repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

```bash
# อัพเดทแพ็คเกจอีกครั้ง
sudo apt-get update
```

```bash
# ติดตั้ง Docker Engine
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

**Output ที่คาดหวัง:**
```
Reading package lists... Done
Building dependency tree... Done
...
Setting up docker-ce (5:24.0.0-1~ubuntu.22.04~jammy) ...
Created symlink /etc/systemd/system/multi-user.target.wants/docker.service → /lib/systemd/system/docker.service.
Created symlink /etc/systemd/system/sockets.target.wants/docker.socket → /lib/systemd/system/docker.socket.
```

### 1.2 ติดตั้ง Docker บน macOS

```bash
# ดาวน์โหลด Docker Desktop for Mac จาก
# https://www.docker.com/products/docker-desktop

# หรือใช้ Homebrew
brew install --cask docker
```

### 1.3 ติดตั้ง Docker บน Windows

1. ดาวน์โหลด Docker Desktop for Windows จาก https://www.docker.com/products/docker-desktop
2. รันไฟล์ติดตั้ง
3. เปิด Docker Desktop

### 1.4 ตรวจสอบการติดตั้ง Docker

```bash
# ตรวจสอบเวอร์ชัน Docker
docker --version
```

**Output ที่คาดหวัง:**
```
Docker version 24.0.5, build ced0996
```

```bash
# ตรวจสอบเวอร์ชัน Docker Compose
docker compose version
```

**Output ที่คาดหวัง:**
```
Docker Compose version v2.20.2
```

```bash
# ทดสอบรัน container
sudo docker run hello-world
```

**Output ที่คาดหวัง:**
```
Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
...
Hello from Docker!
This message shows that your installation appears to be working correctly.
```

### 1.5 เพิ่มสิทธิ์ใช้งาน Docker โดยไม่ต้องใช้ sudo (Linux)

```bash
# สร้างกลุ่ม docker
sudo groupadd docker

# เพิ่มผู้ใช้ปัจจุบันเข้ากลุ่ม docker
sudo usermod -aG docker $USER

# Logout และ Login อีกครั้ง หรือใช้คำสั่ง
newgrp docker

# ทดสอบโดยไม่ใช้ sudo
docker run hello-world
```

**Output ที่คาดหวัง:**
```
Hello from Docker!
...
```

---

## 2. การติดตั้ง Local Supabase

### 2.1 ติดตั้ง Supabase CLI

```bash
# ติดตั้งผ่าน npm
npm install -g supabase
```

**Output ที่คาดหวัง:**
```
added 1 package in 2s
```

```bash
# ตรวจสอบเวอร์ชัน
supabase --version
```

**Output ที่คาดหวัง:**
```
1.123.4
```

### 2.2 เริ่มต้น Supabase Project

```bash
# สร้างโฟลเดอร์สำหรับ local Supabase
mkdir supabase-local
cd supabase-local

# เริ่มต้นโปรเจค
supabase init
```

**Output ที่คาดหวัง:**
```
Finished supabase init.
```

### 2.3 เริ่มต้น Supabase Services

```bash
# เริ่มต้น Supabase services
supabase start
```

**Output ที่คาดหวัง:**
```
Applying migration 20230101000000_init.sql...
Seeding data...
Started supabase local development setup.

         API URL: http://localhost:54321
     GraphQL URL: http://localhost:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ สำคัญ:** บันทึกข้อมูลเหล่านี้ไว้ใช้ในการตั้งค่าต่อไป

### 2.4 ตรวจสอบการทำงาน

```bash
# เปิด Supabase Studio
# ไปที่ http://localhost:54323 ในเว็บเบราว์เซอร์
```

---

## 3. การ Migration ข้อมูลจาก Supabase Cloud

### 3.1 เตรียมการเชื่อมต่อ

```bash
# ติดตั้ง psql client (หากยังไม่มี)
# สำหรับ Ubuntu/Debian
sudo apt-get install postgresql-client

# สำหรับ macOS
brew install postgresql
```

```bash
# ตรวจสอบการติดตั้ง
psql --version
```

**Output ที่คาดหวัง:**
```
psql (PostgreSQL) 15.3
```

### 3.2 เชื่อมต่อกับ Supabase Cloud (Source)

```bash
# ดึงข้อมูล Connection String จาก Supabase Dashboard
# Settings > Database > Connection String (Direct connection)
# ตัวอย่าง: postgresql://postgres:[YOUR-PASSWORD]@db.fgbdndherdtifodzhmiw.supabase.co:5432/postgres

# ทดสอบการเชื่อมต่อ
psql "postgresql://postgres:[YOUR-PASSWORD]@db.fgbdndherdtifodzhmiw.supabase.co:5432/postgres"
```

**Output ที่คาดหวัง:**
```
psql (15.3, server 15.1)
SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, compression: off)
Type "help" for help.

postgres=>
```

### 3.3 Export Schema

#### 3.3.1 Export Database Schema

```bash
# Export schema ของทุกตารางในสกีมา public
pg_dump -h db.fgbdndherdtifodzhmiw.supabase.co \
  -U postgres \
  -d postgres \
  --schema-only \
  --no-owner \
  --no-acl \
  --schema=public \
  -f schema.sql
```

**Input:**
```
Password: [ใส่รหัสผ่าน Supabase]
```

**Output ที่คาดหวัง:**
```
(ไม่มี output หากสำเร็จ)
```

```bash
# ตรวจสอบไฟล์ที่ export ออกมา
ls -lh schema.sql
```

**Output ที่คาดหวัง:**
```
-rw-r--r-- 1 user user 15K Oct 14 10:30 schema.sql
```

```bash
# ดูเนื้อหาบางส่วน
head -n 20 schema.sql
```

**Output ที่คาดหวัง:**
```
--
-- PostgreSQL database dump
--

-- Dumped from database version 15.1
-- Dumped by pg_dump version 15.3

SET statement_timeout = 0;
SET lock_timeout = 0;
...
CREATE TABLE public.admin (
    username text DEFAULT 'admin'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid DEFAULT gen_random_uuid() NOT NULL,
    ...
);
```

#### 3.3.2 Import Schema ไปยัง Local Supabase

```bash
# เชื่อมต่อกับ local Supabase
psql postgresql://postgres:postgres@localhost:54322/postgres -f schema.sql
```

**Output ที่คาดหวัง:**
```
SET
SET
SET
SET
...
CREATE TABLE
CREATE TABLE
CREATE TABLE
...
```

```bash
# ตรวจสอบว่าตารางถูกสร้างแล้ว
psql postgresql://postgres:postgres@localhost:54322/postgres -c "\dt public.*"
```

**Output ที่คาดหวัง:**
```
               List of relations
 Schema |    Name    | Type  |  Owner   
--------+------------+-------+----------
 public | admin      | table | postgres
 public | audit_log  | table | postgres
 public | food       | table | postgres
 public | meal       | table | postgres
 public | order      | table | postgres
 public | person     | table | postgres
 public | plan       | table | postgres
 public | shop       | table | postgres
(8 rows)
```

### 3.4 Export และ Import Data

#### 3.4.1 Export Data แต่ละตาราง

```bash
# สร้างโฟลเดอร์สำหรับเก็บข้อมูล
mkdir -p data_export

# Export ตาราง admin
pg_dump -h db.fgbdndherdtifodzhmiw.supabase.co \
  -U postgres \
  -d postgres \
  --data-only \
  --no-owner \
  --no-acl \
  --table=public.admin \
  -f data_export/admin.sql
```

**Input:**
```
Password: [ใส่รหัสผ่าน]
```

```bash
# ตรวจสอบข้อมูลที่ export
cat data_export/admin.sql
```

**Output ที่คาดหวัง:**
```
--
-- PostgreSQL database dump
--
...
COPY public.admin (username, created_at, user_id, agent_name, state, role) FROM stdin;
admin	2024-01-15 10:30:00+00	123e4567-e89b-12d3-a456-426614174000	ฝนส./ฝปดน.	enable	admin
user1	2024-01-16 08:20:00+00	223e4567-e89b-12d3-a456-426614174001	ฝนส./ฝปดน.	enable	user
\.
```

```bash
# Export ตารางอื่นๆ ทั้งหมด
for table in audit_log food meal order person plan shop; do
  echo "Exporting table: $table"
  pg_dump -h db.fgbdndherdtifodzhmiw.supabase.co \
    -U postgres \
    -d postgres \
    --data-only \
    --no-owner \
    --no-acl \
    --table=public.$table \
    -f data_export/$table.sql
done
```

**Output ที่คาดหวัง:**
```
Exporting table: audit_log
Password: 
Exporting table: food
Password: 
Exporting table: meal
Password: 
...
```

```bash
# ตรวจสอบไฟล์ทั้งหมดที่ export
ls -lh data_export/
```

**Output ที่คาดหวัง:**
```
total 120K
-rw-r--r-- 1 user user  2.5K Oct 14 10:35 admin.sql
-rw-r--r-- 1 user user  8.1K Oct 14 10:35 audit_log.sql
-rw-r--r-- 1 user user  45K Oct 14 10:36 food.sql
-rw-r--r-- 1 user user  12K Oct 14 10:36 meal.sql
-rw-r--r-- 1 user user  25K Oct 14 10:37 order.sql
-rw-r--r-- 1 user user  5.2K Oct 14 10:37 person.sql
-rw-r--r-- 1 user user  8.9K Oct 14 10:38 plan.sql
-rw-r--r-- 1 user user  15K Oct 14 10:38 shop.sql
```

#### 3.4.2 Import Data ไปยัง Local Supabase

```bash
# Import ข้อมูลทีละตาราง (เรียงตามลำดับ foreign key dependencies)
# 1. ตารางที่ไม่มี dependencies
psql postgresql://postgres:postgres@localhost:54322/postgres -f data_export/admin.sql
```

**Output ที่คาดหวัง:**
```
COPY 5
```

```bash
# 2. Import ตารางอื่นๆ ตามลำดับ
for table in shop food plan meal person order audit_log; do
  echo "Importing table: $table"
  psql postgresql://postgres:postgres@localhost:54322/postgres -f data_export/$table.sql
done
```

**Output ที่คาดหวัง:**
```
Importing table: shop
COPY 12
Importing table: food
COPY 156
Importing table: plan
COPY 8
...
```

```bash
# ตรวจสอบจำนวนข้อมูลในแต่ละตาราง
psql postgresql://postgres:postgres@localhost:54322/postgres << EOF
SELECT 'admin' as table_name, COUNT(*) FROM public.admin
UNION ALL
SELECT 'audit_log', COUNT(*) FROM public.audit_log
UNION ALL
SELECT 'food', COUNT(*) FROM public.food
UNION ALL
SELECT 'meal', COUNT(*) FROM public.meal
UNION ALL
SELECT 'order', COUNT(*) FROM public.order
UNION ALL
SELECT 'person', COUNT(*) FROM public.person
UNION ALL
SELECT 'plan', COUNT(*) FROM public.plan
UNION ALL
SELECT 'shop', COUNT(*) FROM public.shop;
EOF
```

**Output ที่คาดหวัง:**
```
 table_name | count 
------------+-------
 admin      |     5
 audit_log  |    23
 food       |   156
 meal       |    32
 order      |    89
 person     |    45
 plan       |     8
 shop       |    12
(8 rows)
```

### 3.5 Export และ Import Functions

#### 3.5.1 Export Functions

```bash
# Export functions ทั้งหมดในสกีมา public
pg_dump -h db.fgbdndherdtifodzhmiw.supabase.co \
  -U postgres \
  -d postgres \
  --schema=public \
  --routine-only \
  --no-owner \
  --no-acl \
  -f functions.sql
```

**Input:**
```
Password: [ใส่รหัสผ่าน]
```

```bash
# ตรวจสอบ functions ที่ export
cat functions.sql
```

**Output ที่คาดหวัง:**
```
--
-- PostgreSQL database dump
--

-- Function: public.handle_new_admin_user()
CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.admin (user_id, username, agent_name, role, state)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    'ฝนส./ฝปดน.',
    'user',
    'enable'
  );
  ...
END;
$function$;

-- Function: public.log_admin_changes()
CREATE OR REPLACE FUNCTION public.log_admin_changes()
...
```

#### 3.5.2 Import Functions ไปยัง Local Supabase

```bash
# Import functions
psql postgresql://postgres:postgres@localhost:54322/postgres -f functions.sql
```

**Output ที่คาดหวัง:**
```
CREATE FUNCTION
CREATE FUNCTION
```

```bash
# ตรวจสอบ functions ที่ถูก import
psql postgresql://postgres:postgres@localhost:54322/postgres -c "\df public.*"
```

**Output ที่คาดหวัง:**
```
                                   List of functions
 Schema |         Name          | Result data type |  Argument data types  | Type 
--------+-----------------------+------------------+-----------------------+------
 public | handle_new_admin_user | trigger          |                       | func
 public | log_admin_changes     | trigger          |                       | func
(2 rows)
```

### 3.6 Export และ Import Triggers

#### 3.6.1 แสดง Triggers ที่มีอยู่

```bash
# เชื่อมต่อกับ Supabase Cloud และดู triggers
psql "postgresql://postgres:[YOUR-PASSWORD]@db.fgbdndherdtifodzhmiw.supabase.co:5432/postgres" << EOF
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
EOF
```

**Output ที่คาดหวัง:**
```
       trigger_name        | event_manipulation | event_object_table |                action_statement                
---------------------------+--------------------+--------------------+-----------------------------------------------
 on_auth_user_created      | INSERT             | admin              | EXECUTE FUNCTION handle_new_admin_user()
 on_admin_change           | UPDATE             | admin              | EXECUTE FUNCTION log_admin_changes()
 on_admin_delete           | DELETE             | admin              | EXECUTE FUNCTION log_admin_changes()
(3 rows)
```

#### 3.6.2 Export Triggers

```bash
# Export triggers (รวมอยู่ใน schema dump แล้ว แต่สามารถ export แยกได้)
pg_dump -h db.fgbdndherdtifodzhmiw.supabase.co \
  -U postgres \
  -d postgres \
  --schema=public \
  --no-owner \
  --no-acl \
  --section=post-data \
  -f triggers.sql
```

```bash
# ดู triggers ที่ export
grep -A 5 "CREATE TRIGGER" triggers.sql
```

**Output ที่คาดหวัง:**
```
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON public.admin
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_admin_user();

CREATE TRIGGER on_admin_change
    AFTER UPDATE ON public.admin
    FOR EACH ROW
    EXECUTE FUNCTION public.log_admin_changes();
```

#### 3.6.3 Import Triggers ไปยัง Local Supabase

```bash
# Import triggers
psql postgresql://postgres:postgres@localhost:54322/postgres -f triggers.sql
```

**Output ที่คาดหวัง:**
```
CREATE TRIGGER
CREATE TRIGGER
CREATE TRIGGER
```

```bash
# ตรวจสอบ triggers ที่ถูก import
psql postgresql://postgres:postgres@localhost:54322/postgres << EOF
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
EOF
```

**Output ที่คาดหวัง:**
```
       trigger_name        | event_manipulation | event_object_table 
---------------------------+--------------------+--------------------
 on_auth_user_created      | INSERT             | admin
 on_admin_change           | UPDATE             | admin
 on_admin_delete           | DELETE             | admin
(3 rows)
```

### 3.7 Export และ Import RLS Policies

#### 3.7.1 Export RLS Policies

```bash
# Export RLS policies และ enable RLS statements
pg_dump -h db.fgbdndherdtifodzhmiw.supabase.co \
  -U postgres \
  -d postgres \
  --schema=public \
  --no-owner \
  --no-acl \
  -f rls_policies.sql
```

```bash
# กรอง RLS policies จากไฟล์
grep -E "ENABLE ROW LEVEL SECURITY|CREATE POLICY" rls_policies.sql
```

**Output ที่คาดหวัง:**
```
ALTER TABLE public.admin ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can delete admin records" ON public.admin FOR DELETE TO authenticated USING (true);
CREATE POLICY "Admins can insert admin records" ON public.admin FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update admin records" ON public.admin FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can view all admin records" ON public.admin FOR SELECT TO authenticated USING (true);
...
```

#### 3.7.2 Import RLS Policies ไปยัง Local Supabase

```bash
# Import RLS policies
psql postgresql://postgres:postgres@localhost:54322/postgres -f rls_policies.sql
```

**Output ที่คาดหวัง:**
```
ALTER TABLE
CREATE POLICY
CREATE POLICY
CREATE POLICY
...
```

```bash
# ตรวจสอบ RLS policies
psql postgresql://postgres:postgres@localhost:54322/postgres << EOF
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
EOF
```

**Output ที่คาดหวัง:**
```
 schemaname | tablename |          policyname           |   cmd    |      roles      
------------+-----------+-------------------------------+----------+-----------------
 public     | admin     | Admins can delete admin...    | DELETE   | {authenticated}
 public     | admin     | Admins can insert admin...    | INSERT   | {authenticated}
 public     | admin     | Admins can update admin...    | UPDATE   | {authenticated}
 public     | admin     | Admins can view all admin...  | SELECT   | {authenticated}
 public     | audit_log | Admins can view all audit...  | SELECT   | {authenticated}
 public     | audit_log | System can insert audit logs  | INSERT   | {authenticated}
...
(20 rows)
```

### 3.8 Export และ Import Storage Buckets

#### 3.8.1 Export Storage Buckets Configuration

```bash
# Export storage buckets
pg_dump -h db.fgbdndherdtifodzhmiw.supabase.co \
  -U postgres \
  -d postgres \
  --schema=storage \
  --table=storage.buckets \
  --data-only \
  --no-owner \
  --no-acl \
  -f storage_buckets.sql
```

```bash
# ตรวจสอบ buckets ที่ export
cat storage_buckets.sql
```

**Output ที่คาดหวัง:**
```
COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id) FROM stdin;
bucket	bucket	\N	2024-01-15 10:00:00+00	2024-01-15 10:00:00+00	t	f	\N	\N	\N
shop	shop	\N	2024-01-15 10:00:00+00	2024-01-15 10:00:00+00	t	f	\N	\N	\N
\.
```

#### 3.8.2 Export Storage Policies

```bash
# Export storage policies
pg_dump -h db.fgbdndherdtifodzhmiw.supabase.co \
  -U postgres \
  -d postgres \
  --schema=storage \
  -f storage_policies.sql
```

```bash
# ดู storage policies
grep "CREATE POLICY" storage_policies.sql
```

#### 3.8.3 Import Storage Configuration ไปยัง Local Supabase

```bash
# Import storage buckets
psql postgresql://postgres:postgres@localhost:54322/postgres -f storage_buckets.sql
```

**Output ที่คาดหวัง:**
```
COPY 2
```

```bash
# Import storage policies
psql postgresql://postgres:postgres@localhost:54322/postgres -f storage_policies.sql
```

```bash
# ตรวจสอบ storage buckets
psql postgresql://postgres:postgres@localhost:54322/postgres << EOF
SELECT id, name, public FROM storage.buckets;
EOF
```

**Output ที่คาดหวัง:**
```
   id   | name   | public 
--------+--------+--------
 bucket | bucket | t
 shop   | shop   | t
(2 rows)
```

### 3.9 สคริปต์อัตโนมัติสำหรับ Migration ทั้งหมด

สร้างไฟล์ `migrate_all.sh`:

```bash
#!/bin/bash

# กำหนดตัวแปร
CLOUD_HOST="db.fgbdndherdtifodzhmiw.supabase.co"
CLOUD_USER="postgres"
CLOUD_DB="postgres"
LOCAL_CONN="postgresql://postgres:postgres@localhost:54322/postgres"

echo "=== Supabase Migration Script ==="
echo ""

# รับ password
read -sp "Enter Supabase Cloud Password: " CLOUD_PASSWORD
echo ""

# สร้างโฟลเดอร์สำหรับ export
mkdir -p migration_export/data

echo "1. Exporting schema..."
PGPASSWORD=$CLOUD_PASSWORD pg_dump -h $CLOUD_HOST -U $CLOUD_USER -d $CLOUD_DB \
  --schema-only --no-owner --no-acl --schema=public \
  -f migration_export/schema.sql

echo "2. Exporting functions..."
PGPASSWORD=$CLOUD_PASSWORD pg_dump -h $CLOUD_HOST -U $CLOUD_USER -d $CLOUD_DB \
  --schema=public --routine-only --no-owner --no-acl \
  -f migration_export/functions.sql

echo "3. Exporting data..."
TABLES=(admin shop food plan meal person order audit_log)
for table in "${TABLES[@]}"; do
  echo "  - Exporting $table..."
  PGPASSWORD=$CLOUD_PASSWORD pg_dump -h $CLOUD_HOST -U $CLOUD_USER -d $CLOUD_DB \
    --data-only --no-owner --no-acl --table=public.$table \
    -f migration_export/data/$table.sql
done

echo "4. Exporting storage..."
PGPASSWORD=$CLOUD_PASSWORD pg_dump -h $CLOUD_HOST -U $CLOUD_USER -d $CLOUD_DB \
  --schema=storage --data-only --no-owner --no-acl \
  -f migration_export/storage.sql

echo ""
echo "=== Importing to Local Supabase ==="
echo ""

echo "1. Importing schema..."
psql $LOCAL_CONN -f migration_export/schema.sql > /dev/null 2>&1

echo "2. Importing functions..."
psql $LOCAL_CONN -f migration_export/functions.sql > /dev/null 2>&1

echo "3. Importing data..."
for table in "${TABLES[@]}"; do
  echo "  - Importing $table..."
  psql $LOCAL_CONN -f migration_export/data/$table.sql > /dev/null 2>&1
done

echo "4. Importing storage..."
psql $LOCAL_CONN -f migration_export/storage.sql > /dev/null 2>&1

echo ""
echo "=== Verification ==="
echo ""

psql $LOCAL_CONN << EOF
SELECT 'Tables' as category, COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'
UNION ALL
SELECT 'Functions', COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public'
UNION ALL
SELECT 'Triggers', COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public'
UNION ALL
SELECT 'RLS Policies', COUNT(*)::bigint FROM pg_policies WHERE schemaname = 'public';
EOF

echo ""
echo "Migration completed successfully!"
```

ทำให้สคริปต์รันได้:

```bash
chmod +x migrate_all.sh
```

รันสคริปต์:

```bash
./migrate_all.sh
```

**Output ที่คาดหวัง:**
```
=== Supabase Migration Script ===

Enter Supabase Cloud Password: 
1. Exporting schema...
2. Exporting functions...
3. Exporting data...
  - Exporting admin...
  - Exporting shop...
  - Exporting food...
  ...

=== Importing to Local Supabase ===

1. Importing schema...
2. Importing functions...
3. Importing data...
  - Importing admin...
  - Importing shop...
  ...

=== Verification ===

  category   | count 
-------------+-------
 Tables      |     8
 Functions   |     2
 Triggers    |     3
 RLS Policies|    20
(4 rows)

Migration completed successfully!
```

---

## 4. การ Deploy Web Application

### 4.1 เตรียม Environment Variables

```bash
# แก้ไขไฟล์ docker-compose.yml
nano docker-compose.yml
```

อัพเดทค่า environment variables:

```yaml
environment:
  - VITE_SUPABASE_URL=http://localhost:54321
  - VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # ใช้ anon key จาก supabase start
  - VITE_SUPABASE_PROJECT_ID=local-project
```

### 4.2 Build Docker Image

```bash
# Build image
docker compose build
```

**Output ที่คาดหวัง:**
```
[+] Building 45.2s (15/15) FINISHED
 => [internal] load build definition from Dockerfile
 => => transferring dockerfile: 456B
 => [internal] load .dockerignore
 => => transferring context: 245B
 => [internal] load metadata for docker.io/library/nginx:alpine
 => [internal] load metadata for docker.io/library/node:20-alpine
...
 => [builder 6/6] RUN npm run build
 => [stage-1 2/3] COPY --from=builder /app/dist /usr/share/nginx/html
 => [stage-1 3/3] COPY nginx.conf /etc/nginx/conf.d/default.conf
 => exporting to image
 => => exporting layers
 => => writing image sha256:abc123def456...
 => => naming to docker.io/library/food-order-web
```

```bash
# ตรวจสอบ image ที่สร้าง
docker images | grep food-order
```

**Output ที่คาดหวัง:**
```
food-order-web   latest    abc123def456   2 minutes ago   45.2MB
```

### 4.3 รัน Container

```bash
# เริ่มต้น container
docker compose up -d
```

**Output ที่คาดหวัง:**
```
[+] Running 2/2
 ✔ Network food-order_app-network  Created
 ✔ Container food-order-web        Started
```

```bash
# ตรวจสอบสถานะ container
docker compose ps
```

**Output ที่คาดหวัง:**
```
NAME                IMAGE                    STATUS              PORTS
food-order-web      food-order-web:latest    Up 10 seconds       0.0.0.0:3000->80/tcp
```

### 4.4 ตรวจสอบการทำงาน

```bash
# ตรวจสอบ logs
docker compose logs -f web
```

**Output ที่คาดหวัง:**
```
food-order-web  | /docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration
food-order-web  | /docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/
...
food-order-web  | 2024/10/14 10:45:23 [notice] 1#1: start worker process 30
```

เปิดเว็บเบราว์เซอร์และไปที่: `http://localhost:3000`

---

## 5. การตรวจสอบและแก้ไขปัญหา

### 5.1 ตรวจสอบการเชื่อมต่อ Supabase

```bash
# ตรวจสอบว่า Supabase services ทำงาน
supabase status
```

**Output ที่คาดหวัง:**
```
supabase local development setup is running.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
```

### 5.2 ตรวจสอบ Container Logs

```bash
# ดู logs ของ web container
docker compose logs web

# ติดตาม logs แบบ real-time
docker compose logs -f web
```

### 5.3 ตรวจสอบการเชื่อมต่อฐานข้อมูล

```bash
# เข้าไปใน container
docker compose exec web sh

# ทดสอบเชื่อมต่อ (ภายใน container)
wget -O- http://localhost:54321/rest/v1/
```

### 5.4 Restart Services

```bash
# Restart web application
docker compose restart web

# Restart Supabase
supabase stop
supabase start
```

### 5.5 ลบและสร้างใหม่

```bash
# หยุดและลบ containers
docker compose down

# ลบ images
docker rmi food-order-web

# Build และรันใหม่
docker compose up -d --build
```

### 5.6 ตรวจสอบ Network

```bash
# ตรวจสอบ networks
docker network ls

# ตรวจสอบรายละเอียด network
docker network inspect food-order_app-network
```

### 5.7 ดูการใช้ resources

```bash
# ดูการใช้ CPU, Memory
docker stats food-order-web
```

**Output ที่คาดหวัง:**
```
CONTAINER ID   NAME             CPU %   MEM USAGE / LIMIT     MEM %   NET I/O         BLOCK I/O
abc123def456   food-order-web   0.05%   12.5MiB / 7.775GiB   0.16%   1.2kB / 850B    0B / 0B
```

---

## 6. คำสั่งที่เป็นประโยชน์

### Docker Commands

```bash
# ดู containers ทั้งหมด
docker ps -a

# ดู images ทั้งหมด
docker images

# ลบ container ที่หยุดแล้ว
docker container prune

# ลบ images ที่ไม่ใช้
docker image prune

# ดู logs
docker compose logs [service-name]

# หยุด services
docker compose stop

# เริ่ม services
docker compose start

# Rebuild และ restart
docker compose up -d --build

# ลบทั้งหมด (containers, networks, volumes)
docker compose down -v
```

### Supabase Commands

```bash
# เริ่ม Supabase
supabase start

# หยุด Supabase
supabase stop

# ดูสถานะ
supabase status

# Reset database
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > src/types/database.ts
```

### PostgreSQL Commands

```bash
# เชื่อมต่อฐานข้อมูล
psql postgresql://postgres:postgres@localhost:54322/postgres

# ดูตารางทั้งหมด
\dt public.*

# ดู functions
\df public.*

# ดู triggers
\dS public.*

# ดูข้อมูลในตาราง
SELECT * FROM public.admin LIMIT 10;

# ออกจาก psql
\q
```

---

## 7. Production Deployment Tips

### 7.1 ใช้ Environment Variables จากไฟล์

สร้างไฟล์ `.env.production`:

```env
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_production_anon_key
VITE_SUPABASE_PROJECT_ID=your_production_project_id
```

อัพเดท docker-compose.yml:

```yaml
services:
  web:
    env_file:
      - .env.production
```

### 7.2 ใช้ Multi-stage Build เพื่อลดขนาด Image

(ไฟล์ Dockerfile ที่มีอยู่แล้วเป็น multi-stage build)

### 7.3 Security Best Practices

```bash
# เปลี่ยน default password ของ Supabase
# อย่าใช้ password: "postgres" ใน production

# ใช้ HTTPS สำหรับ production
# ตั้งค่า reverse proxy (nginx, traefik) พร้อม SSL certificate
```

---

## สรุป

คู่มือนี้ครอบคลุม:

1. ✅ การติดตั้ง Docker และ Docker Compose
2. ✅ การติดตั้ง Local Supabase
3. ✅ การ Export และ Import Schema
4. ✅ การ Export และ Import Data
5. ✅ การ Export และ Import Functions
6. ✅ การ Export และ Import Triggers  
7. ✅ การ Export และ Import RLS Policies
8. ✅ การ Export และ Import Storage Buckets
9. ✅ การ Deploy Web Application ด้วย Docker
10. ✅ การตรวจสอบและแก้ไขปัญหา

หากพบปัญหาหรือมีคำถาม กรุณาตรวจสอบ logs และ error messages อย่างละเอียด
