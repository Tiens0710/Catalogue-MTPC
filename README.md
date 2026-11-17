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
├── index.html      # Nội dung 18 trang catalogue
├── css/style.css   # Toàn bộ giao diện (màu sắc, hiệu ứng lật)
├── js/main.js      # Logic lật trang, bàn phím, vuốt, fullscreen
└── images/         # Ảnh thật của trường (đặt đúng tên theo bảng trên)
```

> Thông tin trong catalogue lấy từ website chính thức **mtpc.edu.vn** (tháng 11/2026):
> 4 ngành Y sỹ đa khoa, Dược, Điều dưỡng, CNTT định hướng AI · Hotline/Zalo 0375 711 766 ·
> 130C–130D Nguyễn Văn Cừ (nối dài), phường Tân An, TP. Cần Thơ.
