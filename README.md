# Catalogue Trường Trung cấp Miền Tây (MTPC)

Website catalogue/brochure dạng **lật trang (flipbook)** giới thiệu trường và các ngành đào tạo — tone chủ đạo **xanh lá pastel (sage & mint dịu) & trắng kem** thanh khiết.

## Chạy thử

Chỉ cần mở file `index.html` bằng trình duyệt (nhấp đúp). Không cần cài đặt gì thêm.

## Cách lật trang

- **Bấm vào nửa phải** của sách → lật tới · **nửa trái** → lật lui
- Bàn phím: `←` `→` `Space` · `Home` về bìa · `End` đến trang cuối
- Trên điện thoại: **vuốt** trái/phải (tự chuyển sang chế độ 1 trang)
- Thanh công cụ dưới: về bìa, trang trước/sau, đến trang cuối, **toàn màn hình**

## Thay ảnh placeholder bằng ảnh thật

Ảnh hiện tại là khung màu xanh nhạt kèm tên file gợi ý. Bạn chỉ cần **chép ảnh thật vào thư mục `images/`** với **đúng tên file** rồi tải lại trang — ảnh tự hiện thay placeholder.

Catalogue theo phong cách **ảnh chủ đạo** — mỗi trang có ảnh lớn tràn mép, ưu tiên ảnh thật nhất có thể:

| Tên file | Vị trí / nội dung gợi ý | Tỉ lệ khung hình |
|---|---|---|
| `images/cover.jpg` | Bìa — toàn cảnh trường / nhóm học sinh | Dọc, tràn trang |
| `images/campus.jpg` | P2 Khái quát — tòa nhà trường, sân trường | Ngang 16:7 / 16:9 |
| `images/vision.jpg` | P3 Tầm nhìn — lớp học, thầy trò | Ngang 16:7 / 16:9 |
| `images/training.jpg` | P4 Hoạt động đào tạo — giờ thực hành | Ngang 16:7 / 16:9 |
| `images/why-1.jpg` | P5 Vì sao chọn — hoạt động ngoại khóa / thực hành | Ngang 16:9 / 4:3 |
| `images/why-2.jpg` | P5 Vì sao chọn — sinh viên trong khuôn viên | Ngang 16:9 / 4:3 |
| `images/programs.jpg` | P6 Menu ngành — nhóm học sinh trong phòng thực hành | Ngang 16:5 / 16:6 |
| `images/y-si.jpg` | P7 Y sỹ đa khoa — học sinh thực hành y khoa | Ngang 16:7 / 16:9 |
| `images/duoc.jpg` | P8 Dược — thực hành tại nhà thuốc/lab dược | Ngang 16:7 / 16:9 |
| `images/dieu-duong.jpg` | P9 Điều dưỡng — thực hành chăm sóc | Ngang 16:7 / 16:9 |
| `images/cntt.jpg` | P10 CNTT — phòng máy tính / công nghệ | Ngang 16:7 / 16:9 |
| `images/son-oto.jpg` | P11 Sơn ô tô — xưởng thực hành | Ngang 4:3 |
| `images/han-cnc.jpg` | P11 Hàn công nghệ cao — mối hàn, thợ hàn | Ngang 4:3 |
| `images/sua-may-tinh.jpg` | P11 Sửa chữa máy tính — tháo lắp linh kiện | Ngang 4:3 |
| `images/rang-ham-mat.jpg` | P12 Răng hàm mặt — thực hành nha khoa | Ngang 4:3 |
| `images/chuyen-doi-dieu-duong.jpg` | P12 Chứng chỉ chuyển đổi Điều dưỡng | Ngang 4:3 |
| `images/xoa-bop.jpg` | P12 Xoa bóp bấm huyệt – VLTL | Ngang 4:3 |
| `images/students.jpg` | P13 Đối tượng tuyển sinh — nhóm học sinh | Ngang 16:7 / 16:8 |
| `images/partners.jpg` | P14 Hợp tác — lễ ký kết / gặp gỡ đối tác | Ngang 16:7 / 16:9 |
| `images/future.jpg` | P15 Định hướng — sinh viên trong đồng phục | Ngang 16:7 / 16:9 |
| `images/contact.jpg` | P16 Liên hệ — cổng trường / văn phòng tuyển sinh | Ngang 16:5 / 16:6 |
| `images/closing.jpg` | P17 Lời kết — hoàng hôn sông nước / trường | Dọc, tràn trang |

> Khung ảnh hiện nay được thiết kế chuẩn theo tỉ lệ ngang **16:9 / 16:7** và **4:3** — rất phù hợp với ảnh chụp máy ảnh, điện thoại thực tế tại trường (lớp học, giảng đường, phòng lab, xưởng thực hành). Ảnh đưa vào sẽ tự động phủ đẹp (`object-fit: cover`) và bo góc tròn hiện đại, không bị méo. Định dạng khuyến nghị `.jpg`.

## Sửa nội dung

Toàn bộ nội dung nằm trong `index.html`, đánh dấu rõ theo từng trang (P1 → P18) bằng các comment `SHEET`. Mỗi trang là một `<article class="face ...">`.

## Cấu trúc thư mục

```
catalogue/
├── index.html      # Catalogue tổng — 18 trang
├── css/style.css   # Giao diện dùng chung (màu sắc, hiệu ứng lật)
├── js/main.js      # Logic lật trang, bàn phím, vuốt, fullscreen
├── images/         # Ảnh thật của trường
└── suc-khoe/       # ★ Ebook riêng cho khối ngành sức khỏe (xem dưới)
```

---

# ★ Sổ tay ngành Sức khỏe (`suc-khoe/`)

Ebook **riêng** cho khối sức khỏe — 20 trang / 10 tờ, **tự chứa toàn bộ** (css, js, ảnh riêng) nên có thể copy nguyên thư mục `suc-khoe/` đi nơi khác, nén gửi Zalo hoặc upload host riêng mà vẫn chạy.

## Chạy thử

Mở `suc-khoe/index.html` bằng trình duyệt (nhấp đúp). Không cần cài gì.

## Nội dung 20 trang

| Trang | Nội dung |
|---|---|
| 01 | Bìa — khối ngành Sức khỏe |
| 02 | Lời ngỏ: vì sao chọn nghề chăm sóc sức khỏe |
| 03 | Sáu chương trình (menu, chạm để mở trang chi tiết) |
| 04–06 | Y sĩ đa khoa · Dược sĩ · Điều dưỡng (trung cấp) |
| 07–09 | Răng hàm mặt · Chứng chỉ chuyển đổi Điều dưỡng · Xoa bóp bấm huyệt – VLTL |
| 10 | Bảng so sánh 3 ngành trung cấp |
| 11 | Môi trường học &amp; thực hành |
| 12 | Lộ trình nghề nghiệp sau tốt nghiệp |
| 13 | Điều kiện tuyển sinh &amp; hồ sơ |
| 14 | Học phí &amp; chính sách hỗ trợ |
| 15 | Liên thông &amp; học lên |
| 16 | Cảm nhận người học |
| 17 | Hỏi &amp; đáp (FAQ) |
| 18 | Đối tác &amp; cơ sở thực hành |
| 19 | Đăng ký tư vấn + liên hệ |
| 20 | Bìa sau |

## Cấu trúc folder

```
suc-khoe/
├── index.html          # Nội dung 20 trang (đánh dấu SHEET / P1…P20)
├── css/style.css       # Bản copy engine giao diện dùng chung
├── css/suc-khoe.css    # Theme riêng: sắc teal y khoa + thành phần mới
├── js/main.js          # Bản copy engine lật trang
└── images/             # Ảnh riêng của ebook
```

> **Lưu ý đồng bộ:** `css/style.css` và `js/main.js` trong `suc-khoe/` là **bản copy**. Khi sửa hiệu ứng lật ở catalogue tổng, phải chép lại 2 file này sang `suc-khoe/` để hai bên giống nhau.

## Ngôn ngữ thiết kế

Mỗi trang dùng chung một hệ khung: **thanh đầu trang** (tên sổ tay + nhãn mục) → **nội dung** → **đường kẻ chân trang** (ghi chú + số trang). Nhờ vậy 20 trang nhìn như một ấn phẩm được thiết kế, không phải các trang rời ghép lại.

- Màu: giấy kem `#FDFBF6`, mực xanh đậm `#0B2F2A`, teal y khoa `#0E8F79` / `#0A5E50`, mint `#E7F4EF`, vàng đồng `#B98F44` cho số liệu chờ cập nhật.
- Chữ: Cormorant Garamond cho tiêu đề lớn, Be Vietnam Pro cho nội dung.
- Khoảng trắng được chia đều giữa các khối (không dồn một cục ở đáy trang).

## Thành phần CSS (chỉ có trong sách sức khỏe)

| Class | Dùng cho |
|---|---|
| `.skpg` + `.page-inner.sk` | Khung trang nội dung (thanh đầu/chân) |
| `.sk-top` / `.sk-bot` | Thanh đầu trang / chân trang có số trang |
| `.sk-kick` / `.sk-h1` / `.sk-lead` | Nhãn mục / tiêu đề lớn / đoạn dẫn |
| `.sk-shot.hero` | Ảnh băng ngang (đầu/giữa trang xen kẽ — tự lấp chỗ trống, trần 21em) |
| `.frame-mat` / `.frame-line` / `.warm` / `.ph-cap` | Khung ảnh dùng chung catalogue tổng: tấm lót lệch / hairline / tông vàng đồng / caption serif trên ảnh |
| `.sk-spec` | Dải thông số 1 dòng mảnh (thời gian, hình thức, văn bằng) |
| `.sk-rows` / `.sk-row` | Danh sách nội dung đánh số |
| `.sk-list` / `.sk-item` | Danh mục 6 chương trình (trang 03) |
| `.sk-tbl` | Bảng so sánh ba ngành |

> Ảnh suc-khoe: 12/13 ảnh trong `suc-khoe/images/` đã dùng (P4–P9, P11, P12, P15, P16, P18); chỉ còn `closing.jpg` chưa gắn. Chữ co theo khổ sách (`cqi`), mobile có sàn riêng 10.5px; cửa sổ thấp (≤700px) tự siết giãn dòng để không tràn.
| `.sk-pick` | Thẻ “chọn ngành nếu…” / 4 nhóm đối tượng |
| `.sk-faq` | Khối hỏi đáp 2 cột |
| `.sk-jobs` / `.sk-job` | Sáu hướng làm việc sau tốt nghiệp |
| `.sk-hot` | Dải nổi bật (hotline / lịch học) |
| `.sk-quote` | Cảm nhận người học |
| `.skcover` / `.skcv` | Bìa |
| `.skback` | Bìa sau |
| `.sk-note` | Ghi chú nhỏ |
| `.sk-todo` | **Đánh dấu số liệu còn thiếu** (chữ vàng đồng) |

## Việc cần làm trước khi phát hành

Tìm các chỗ `<span class="sk-todo">…</span>` trong `suc-khoe/index.html` (nền vàng) và thay bằng số liệu thật:

1. Thời gian đào tạo từng ngành (P4, P5, P6, P10)
2. Điều kiện tuyển sinh / hồ sơ chính thức (P4–P9, P13)
3. Học phí &amp; chính sách ưu đãi (P14)
4. Cảm nhận người học thật + tên (P16)
5. Thời lượng các khóa sơ cấp/chứng chỉ (P7, P8, P9)

**Ảnh:** 10 ảnh hiện dùng lại từ catalogue tổng. Nên bổ sung ảnh riêng cho bìa (`images/sk-cover.jpg`, ảnh dọc) và trang thực hành.

## Đồng bộ hotline

HTML đang dùng: **0934 790 790 · 0292 222 6677 · 0292 222 5577**. README gốc có nhắc số 0375 711 766 — cần chốt một số chính thức rồi cập nhật cả hai nơi (bìa, P19, P20).


> Thông tin trong catalogue lấy từ website chính thức **mtpc.edu.vn** (tháng 11/2026):
> 4 ngành Y sỹ đa khoa, Dược, Điều dưỡng, CNTT định hướng AI · Hotline/Zalo 0375 711 766 ·
> 130C–130D Nguyễn Văn Cừ (nối dài), phường Tân An, TP. Cần Thơ.
