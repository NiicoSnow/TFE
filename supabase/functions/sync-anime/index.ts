import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import {
  fetchAnilistPage,
  PAGE_DELAY_MS,
  sleep,
} from '../_shared/anilistSync.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const cronSecret = Deno.env.get('CRON_SECRET')
  const auth = req.headers.get('Authorization')
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Missing Supabase env' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const url = new URL(req.url)
  const startPage = Math.max(1, Number(url.searchParams.get('startPage') ?? '1'))
  const pagesToSync = Math.min(25, Math.max(1, Number(url.searchParams.get('pages') ?? '10')))

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  let currentPage = startPage
  let totalUpserted = 0
  let hasNextPage = true

  try {
    for (let i = 0; i < pagesToSync && hasNextPage; i++) {
      const result = await fetchAnilistPage(currentPage)

      if (result.rateLimited) {
        return new Response(
          JSON.stringify({
            ok: false,
            rateLimited: true,
            retryAfter: result.retryAfter,
            lastPage: currentPage,
            totalUpserted,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      if (result.rows.length > 0) {
        const { error } = await supabase.from('anime_cache').upsert(result.rows, {
          onConflict: 'anilist_id',
        })
        if (error) throw error
        totalUpserted += result.rows.length
      }

      hasNextPage = result.pageInfo.hasNextPage
      currentPage += 1

      if (i < pagesToSync - 1 && hasNextPage) {
        await sleep(PAGE_DELAY_MS)
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        totalUpserted,
        nextPage: hasNextPage ? currentPage : null,
        done: !hasNextPage,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed'
    return new Response(JSON.stringify({ ok: false, error: message, lastPage: currentPage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
