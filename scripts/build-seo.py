from pathlib import Path
import re,json,html
root=Path(__file__).resolve().parents[1]
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
base=root;domain='https://blog.fynxfinanceworld.com';posts=json.loads((base/'posts.json').read_text());template=(base/'post.html').read_text();(base/'articles').mkdir(exist_ok=True)
urls=[domain+'/',domain+'/google-play.html',domain+'/risk-disclosure.html']
for post in posts:
 slug=post['slug'];url=domain+'/articles/'+slug+'.html';s=template
 s=re.sub(r'<script src="\./post.js[^>]*></script>','',s)
 for id,value in [('postCategory',html.escape(post['category'])),('postDate',post['date']),('postTitle',html.escape(post['title'])),('postExcerpt',html.escape(post['excerpt'])),('postBody',(base/'content'/f'{slug}.inc').read_text())]:
  s=re.sub(r'(<(?:span|h1|p|div)\b[^>]*id="'+id+r'"[^>]*>).*?(</(?:span|h1|p|div)>)',lambda m:m[1]+value+m[2],s,flags=re.S)
 s=s.replace('href="./','href="../').replace('src="./','src="../')
 s=re.sub(r'<!-- search-identity:start -->.*?<!-- search-identity:end -->','',s,flags=re.S)
 s=meta(s,post['title']+' | FYNX Journal',post['excerpt'],url)
 schema={'@context':'https://schema.org','@type':'BlogPosting','headline':post['title'],'description':post['excerpt'],'datePublished':post['date'],'dateModified':post.get('updated',post['date']),'mainEntityOfPage':url,'author':{'@type':'Organization','@id':domain+'/#editorial','name':'FYNX Editorial','url':domain+'/'},'publisher':{'@id':'https://www.fynxfinanceworld.com/#organization'}}
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
# Source fragments and old nested URLs resolve to the full, canonical article.
for p in (base/'posts').rglob('*.html'):
 destination=domain+'/articles/'+p.stem+'.html'
 if p.stem not in {x['slug'] for x in posts}: raise ValueError('Unknown legacy article: '+str(p))
 p.write_text(f'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Article moved | FYNX Journal</title><meta name="robots" content="noindex,follow"><link rel="canonical" href="{destination}"><meta http-equiv="refresh" content="0;url={destination}"></head><body><p><a href="{destination}">Read the complete FYNX Journal article</a>.</p></body></html>')
p=base/'post.html';s=p.read_text();s=meta(s,'Find an Article | FYNX Journal','Open an article from the FYNX Journal collection.',domain+'/',True);p.write_text(s)
org={'@type':'Organization','@id':'https://www.fynxfinanceworld.com/#organization','name':'FYNX','url':'https://www.fynxfinanceworld.com/','founder':{'@id':'https://elhamamini.cc/#person'}}
person={'@type':'Person','@id':'https://elhamamini.cc/#person','name':'Elham Amini','url':'https://elhamamini.cc/','sameAs':['https://www.linkedin.com/in/elham-amini-745560302/','https://www.instagram.com/___elham_amini___/']}
for url in urls:
 p=base/('index.html' if url==domain+'/' else url[len(domain)+1:]);s=p.read_text();s=re.sub(r'<!-- search-identity:start -->.*?<!-- search-identity:end -->','',s,flags=re.S)
 title=clean(re.search('<title>(.*?)</title>',s,re.S)[1])
 page={'@type':'CollectionPage' if url==domain+'/' else 'WebPage','@id':url+'#webpage','url':url,'name':title,'isPartOf':{'@id':domain+'/#website'},'publisher':{'@id':org['@id']}}
 if url==domain+'/': page['mainEntity']={'@type':'ItemList','itemListElement':[{'@type':'ListItem','position':i+1,'url':domain+'/articles/'+x['slug']+'.html','name':x['title']} for i,x in enumerate(posts)]}
 graph=[org,person,{'@type':'WebSite','@id':domain+'/#website','url':domain+'/','name':'FYNX Journal','publisher':{'@id':org['@id']}},page]
 s=s.replace('</head>','<!-- search-identity:start --><script type="application/ld+json">'+json.dumps({'@context':'https://schema.org','@graph':graph}).replace('<','\\u003c')+'</script><!-- search-identity:end --></head>')
 if 'https://elhamamini.cc/' not in re.sub('<head>.*?</head>','',s,flags=re.S): s=s.replace('</footer>','<p><a href="https://www.fynxfinanceworld.com/about.html">About FYNX</a> · <a href="https://elhamamini.cc/">Elham Amini, founder</a></p></footer>')
 p.write_text(s)
(base/'_config.yml').write_text('exclude:\n  - content\n  - scripts\n  - README.md\n')
