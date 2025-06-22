import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const featured = searchParams.get('featured')
    
    const supabase = await createClient()
    
    let query = supabase
      .from('reviews')
      .select(`
        *,
        products (
          name,
          image_url
        )
      `)
      .eq('is_verified', true)
      .order('created_at', { ascending: false })

    if (featured === 'true') {
      query = query.eq('is_featured', true)
    }

    const { data: reviews, error } = await query

    if (error) {
      console.error('Error fetching reviews:', error)
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
    }

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('Error in reviews API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { orderId, productId, rating, reviewText } = await request.json()
    
    if (!orderId || !productId || !rating) {
      return NextResponse.json({ error: 'Order ID, product ID, and rating are required' }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the user has a delivered order with this product
    const { data: orderItem, error: orderError } = await supabase
      .from('order_items')
      .select(`
        *,
        orders!inner (
          id,
          user_id,
          status
        )
      `)
      .eq('order_id', orderId)
      .eq('product_id', productId)
      .eq('orders.user_id', user.id)
      .eq('orders.status', 'delivered')
      .single()

    if (orderError || !orderItem) {
      return NextResponse.json({ error: 'You can only review products from your delivered orders' }, { status: 400 })
    }

    // Get user profile for review
    const userProfile = {
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
      email: user.email || ''
    }

    // Insert the review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        order_id: orderId,
        product_id: productId,
        rating,
        review_text: reviewText || null,
        user_name: userProfile.name,
        user_email: userProfile.email,
        is_verified: true
      })
      .select()
      .single()

    if (reviewError) {
      if (reviewError.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 400 })
      }
      console.error('Error creating review:', reviewError)
      return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      review,
      message: 'Review submitted successfully' 
    })
  } catch (error) {
    console.error('Error in review creation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
