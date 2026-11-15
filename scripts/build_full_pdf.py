import os
import io
import json
import time
from PIL import Image
import img2pdf
import pikepdf

def main():
    start_time = time.time()
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    high_dir = os.path.join(project_root, "public", "book_pages", "high")
    meta_path = os.path.join(project_root, "src", "data", "bookMeta.json")
    out_public = os.path.join(project_root, "public", "dangseon_jichimseo_full.pdf")
    out_dist = os.path.join(project_root, "dist", "dangseon_jichimseo_full.pdf")

    with open(meta_path, "r", encoding="utf-8") as f:
        meta_data = json.load(f)

    total_pages = meta_data.get("totalPages", 346)
    print(f"Building optimized full PDF for {total_pages} pages...")

    jpeg_streams = []
    for i in range(1, total_pages + 1):
        filename = f"{i:04d}.webp"
        filepath = os.path.join(high_dir, filename)
        if not os.path.exists(filepath):
            print(f"Warning: {filepath} missing!")
            continue

        with Image.open(filepath) as im:
            rgb_im = im.convert("RGB")
            rgb_im.thumbnail((1250, 1900), Image.Resampling.BILINEAR)
            
            buf = io.BytesIO()
            rgb_im.save(buf, format="JPEG", quality=75, optimize=False)
            jpeg_streams.append(buf.getvalue())

        if i % 50 == 0 or i == total_pages:
            print(f"Processed {i}/{total_pages} pages...")

    print("Converting image streams to PDF via img2pdf...")
    pdf_bytes = img2pdf.convert(jpeg_streams)

    print("Embedding Bookmarks / Table of Contents via pikepdf...")
    pdf = pikepdf.open(io.BytesIO(pdf_bytes))

    with pdf.open_outline() as outline:
        for ch in meta_data.get("chapters", []):
            ch_page_idx = max(0, min(total_pages - 1, ch.get("page", 1) - 1))
            ch_title = ch.get("title", "")
            if ch.get("subtitle"):
                ch_title += f" - {ch.get('subtitle')}"
            ch_item = pikepdf.OutlineItem(ch_title, ch_page_idx)
            outline.root.append(ch_item)

            for sec in ch.get("sections", []):
                sec_page_idx = max(0, min(total_pages - 1, sec.get("page", 1) - 1))
                sec_title = sec.get("title", "").strip()
                sec_item = pikepdf.OutlineItem(sec_title, sec_page_idx)
                ch_item.children.append(sec_item)

    with pdf.open_metadata() as pdf_meta:
        pdf_meta["dc:title"] = meta_data.get("title", "한 권으로 끝내는 당선 지침서")
        pdf_meta["dc:description"] = meta_data.get("subtitle", "이기는 선거비법, 승리를 기획하라")
        pdf_meta["dc:creator"] = ["선거전략연구소"]

    pdf.save(out_public)
    os.makedirs(os.path.dirname(out_dist), exist_ok=True)
    pdf.save(out_dist)

    size_mb = os.path.getsize(out_public) / (1024 * 1024)
    elapsed = time.time() - start_time
    print(f"Done! PDF generated in {elapsed:.1f}s: {size_mb:.2f} MB")
    print(f"Saved to: {out_public}")

if __name__ == "__main__":
    main()
