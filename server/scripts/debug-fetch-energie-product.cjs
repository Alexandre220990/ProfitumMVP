#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function run() {
  const { data, error } = await supabase
    .from('ProduitEligible')
    .select('*')
    .eq('nom', 'Optimisation Énergie')
    .maybeSingle();

  if (error) {
    console.error('Error fetching product:', error);
    process.exit(1);
  }

  console.log(JSON.stringify(data, null, 2));
}

run();

