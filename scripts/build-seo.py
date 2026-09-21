from pathlib import Path
import re,json,html
root=Path(__file__).resolve().parents[2]
def clean(s): return re.sub(r'\s+',' ',html.unescape(re.sub('<[^>]+>',' ',s))).strip()
def meta(s,title,desc,url,private=False):
 s=re.sub(r'<title>.*?</title>','<title>'+html.escape(title)+'</title>',s,flags=re.S|re.I)
 s=re.sub(r'<meta\b[^>]*(?:name=["\'](?:description|robots|twitter:title|twitter:description)["\']|property=["\']og:(?:title|description|url)["\'])[^>]*>','',s,flags=re.I)
 s=re.sub(r'<link\b[^>]*rel=["\']canonical["\'][^>]*>','',s,flags=re.I)
 tags=f'<meta name="description" content="{html.escape(desc,quote=True)}">\n<meta name="robots" content="{"noindex, follow" if private else "index, follow, max-image-preview:large"}">\n<link rel="canonical" href="{html.escape(url,quote=True)}">\n'
 for key,val in [('og:title',title),('og:description',desc),('og:url',url)]: tags+=f'<meta property="{key}" content="{html.escape(val,quote=True)}">\n'
 return s.replace('</head>',tags+'</head>')
def maps(base,domain,urls):
 (base/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join('  <url><loc>'+html.escape(u)+'</loc></url>\n' for u in sorted(set(urls)))+'</urlset>\n')
 (base/'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: '+domain+'/sitemap.xml\n')# Blog: preserve the fragment source files; publish complete articles at /articles/slug.html.
base=root/'fynx-blog';domain='https://blog.fynxfinanceworld.com';posts=json.loads((base/'posts.json').read_text());template=(base/'post.html').read_text();(base/'articles').mkdir(exist_ok=True)
urls=[domain+'/',domain+'/google-play.html',domain+'/risk-disclosure.html']
for post in posts:
 slug=post['slug'];url=domain+'/articles/'+slug+'.html';s=template
 s=re.sub(r'<script src="\./post.js[^>]*></script>','',s)
 for id,value in [('postCategory',html.escape(post['category'])),('postDate',post['date']),('postTitle',html.escape(post['title'])),('postExcerpt',html.escape(post['excerpt'])),('postBody',(base/'posts'/f'{slug}.html').read_text())]:
  s=re.sub(r'(<(?:span|h1|p|div)\b[^>]*id="'+id+r'"[^>]*>).*?(</(?:span|h1|p|div)>)',lambda m:m[1]+value+m[2],s,flags=re.S)
 s=s.replace('href="./','href="../').replace('src="./','src="../')
 s=meta(s,post['title']+' | FYNX Journal',post['excerpt'],url)
 schema={'@context':'https://schema.org','@type':'BlogPosting','headline':post['title'],'description':post['excerpt'],'datePublished':post['date'],'dateModified':post.get('updated',post['date']),'mainEntityOfPage':url,'author':{'@type':'Organization','name':'FYNX Editorial'},'publisher':{'@type':'Organization','name':'FYNX Journal'}}
 s=s.replace('</head>','<script type="application/ld+json">'+json.dumps(schema).replace('<','\\u003c')+'</script></head>');(base/'articles'/f'{slug}.html').write_text(s);urls.append(url)
for name in ['index.html','google-play.html','risk-disclosure.html']:
 p=base/name;s=p.read_text();title=clean(re.search('<title>(.*?)</title>',s,re.S)[1]);d=re.search('<meta name="description" content="([^"]*)"',s);s=meta(s,title,html.unescape(d[1]) if d else title,domain+('/' if name=='index.html' else '/'+name))
 if name=='index.html':
  cards=''.join('<a class="card" href="./articles/'+x['slug']+'.html"><div class="card-top"><span class="card-tag">'+html.escape(x['category'])+'</span></div><h3 class="card-title">'+html.escape(x['title'])+'</h3><p class="card-text">'+html.escape(x['excerpt'])+'</p></a>' for x in posts)
  s=re.sub(r'<!-- article-index:start -->.*?<!-- article-index:end -->', '<!-- article-index:start -->'+cards+'<!-- article-index:end -->', s, flags=re.S) if '<!-- article-index:start -->' in s else s.replace('<p>Loading articles…</p>', '<!-- article-index:start -->'+cards+'<!-- article-index:end -->').replace('<noscript>Enable JavaScript to browse the article collection.</noscript>','')
  s=re.sub(r'\./post.html\?slug=([\w-]+)',r'./articles/\1.html',s)
 p.write_text(s)
p=base/'blog.js';p.write_text(p.read_text().replace('./post.html?slug=${encodeURIComponent(p.slug)}','./articles/${encodeURIComponent(p.slug)}.html'))
p=base/'post.js';s=p.read_text();s=s.replace('document.title = `${meta.title} — FYNX Journal`;','location.replace(`./articles/${encodeURIComponent(meta.slug)}.html`);\n  return;');p.write_text(s)
maps(base,domain,urls)
print('Updated static SEO and generated',len(posts),'complete blog articles.')
