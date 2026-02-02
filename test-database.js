import { supabase } from './src/lib/supabase.js';

async function testDatabase() {
  console.log('Testing database connection and structure...');
  
  try {
    // Test basic connection
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      return;
    }
    
    console.log('Available tables:', tables.map(t => t.table_name));
    
    // Check if sales table exists
    const salesTable = tables.find(t => t.table_name === 'sales');
    console.log('Sales table exists:', !!salesTable);
    
    if (salesTable) {
      // Try to query sales table
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .limit(1);
      
      if (salesError) {
        console.error('Error querying sales table:', salesError);
      } else {
        console.log('Sales table accessible, sample data:', salesData);
      }
    }
    
    // Check RLS status
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('schemaname', 'public')
      .in('tablename', ['sales', 'products', 'profiles']);
    
    if (rlsError) {
      console.error('Error checking RLS status:', rlsError);
    } else {
      console.log('RLS status:', rlsStatus);
    }
    
  } catch (error) {
    console.error('Database test failed:', error);
  }
}

testDatabase();