import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request) {
  try {
    const body = await request.json()
    const { 
      name, 
      business_code, 
      email, 
      phone, 
      address, 
      plan_id, 
      admin_email, 
      admin_name, 
      admin_password 
    } = body

    if (!admin_email || !admin_password) {
      return NextResponse.json({ error: 'Admin email and password are required' }, { status: 400 })
    }

    // 1. Create Auth User using Service Role
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: admin_email,
      password: admin_password,
      email_confirm: true,
      user_metadata: { full_name: admin_name }
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // 2. Create Business Record
    const { data: biz, error: bizErr } = await supabaseAdmin
      .from('businesses')
      .insert([{
        name,
        business_code: business_code.toUpperCase(),
        email,
        phone,
        address,
        plan_id,
        status: 'trial',
      }])
      .select()
      .single()

    if (bizErr) throw bizErr

    // 3. Create Admin Role for this business
    const { data: adminRole, error: roleErr } = await supabaseAdmin
      .from('roles')
      .insert([{
        business_id: biz.id,
        name: 'Admin',
        description: 'Full access to all features',
        is_system: true,
      }])
      .select()
      .single()

    if (roleErr) throw roleErr

    // 4. Create Main Branch
    await supabaseAdmin.from('branches').insert([{
      business_id: biz.id,
      name: 'Main Branch',
      is_main: true,
    }])

    // 5. Create Shop Settings
    await supabaseAdmin.from('shop_settings').insert([{
      business_id: biz.id,
      name,
      phone,
      address,
    }])

    // 6. Link User to Business
    await supabaseAdmin.from('business_users').insert([{
      user_id: authUser.user.id,
      business_id: biz.id,
      role_id: adminRole.id,
      full_name: admin_name,
      is_admin: true,
      is_active: true
    }])

    return NextResponse.json({ success: true, business: biz })
  } catch (error) {
    console.error('Business creation error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create business' }, { status: 500 })
  }
}
