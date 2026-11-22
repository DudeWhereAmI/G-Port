# G-Port – Design audit

Quét toàn bộ `src/` (≈35.800 dòng TS/TSX, Tailwind CSS v4) ngày 23/11/2026, trước khi chuẩn hóa giao diện.

## 1. Hiện trạng

### Font chữ
| Phát hiện | Số lần |
|---|---|
| `font-sans` khai báo `"Inter"` trong `@theme` nhưng **không có file font nào được tải** (không `@import`, không `<link>`) → trình duyệt rơi về font hệ thống (Segoe UI / Arial…), mỗi máy hiển thị khác nhau | – |
| `font-mono` (hệ thống: Consolas/Courier) dùng cho **số liệu, tiêu đề, label** chứ không chỉ cho mã | 401 |
| `fontFamily="monospace"` trong SVG (sơ đồ 2D/3D) | 21 |
| `tabular-nums` chỉ có ở một số chỗ, phần lớn số liệu không thẳng cột | – |

### Cỡ chữ
| Lớp | Số lần | Ghi chú |
|---|---|---|
| `text-[10px]` | 417 | dưới mức tối thiểu 12px cho label |
| `text-[11px]` | 305 | giá trị hard-code |
| `text-[9px]`, `text-[8px]`, `text-[7px]`, `text-[10.5px]` | 36 | quá nhỏ, khó đọc |
| `text-xs` / `text-sm` / `text-base` / `text-lg` / `text-xl` / `text-2xl`+ | 467 / 119 / 56 / 22 / 19 / 35 | không có thang thống nhất cho tiêu đề |
| `fontSize` trong biểu đồ/SVG (7,5 → 11) | ≈ 120 | mỗi biểu đồ một cỡ trục khác nhau |

### Độ đậm
| Lớp | Số lần |
|---|---|
| `font-bold` (700) | 848 |
| `font-black` (900) | 271 |
| `font-extrabold` (800) + `fontWeight 800` | 7 |
| `font-semibold` (600) | 120 |
| `font-medium` (500) | 51 |

→ Hơn 1.100 chỗ chữ đậm 700–900: mọi thứ đều "hét", không còn thứ bậc.

### Chữ in hoa
`uppercase` 209 lần (badge, tiêu đề bảng, nút), `tracking-wider` 63 lần.

### Màu
| Phát hiện | Số lần |
|---|---|
| Mã hex hard-code trong class (`[#004B91]` 329, `[#00386E]` 25, `[#002D62]` 9, `[#1A73E8]` 8, …) | ≈ 385 |
| Mã hex khác nhau trong toàn bộ code | 161 |
| Họ màu Tailwind: slate 2.582 · emerald 339 · blue 208 · amber 177 · sky 45 · red 33 · rose 23 · orange 21 · indigo 21 · cyan 16 · violet 15 · purple 7 · teal 4 · lime 3 | 14 họ màu |
| Bảng màu biểu đồ: mỗi trang tự định nghĩa (M-1 `FEEDERS`, M-3 `ADJUST_COLORS`/`M3_COLORS`, M-2 `SOURCE_META`, Overview…); cùng lộ F-01 nhưng màu khác giữa các trang; Scope 1/2 chưa cố định | – |
| Card cảnh báo dùng viền dày 2px + nền vàng/xanh lá lớn (M-1, M-3, M-2) | nhiều |
| Token cũ `port-dark/medium/light/gray/accent` gần như không dùng | – |

### Bo góc & đổ bóng
| Lớp | Số lần |
|---|---|
| `rounded-xl` (12px) / `rounded-2xl` (16px) / `rounded-3xl` (24px) | 328 / 118 / 9 |
| `rounded-lg` (8px) / `rounded-md` / `rounded` / `rounded-full` | 199 / 21 / 78 / 79 |
| Đổ bóng: `shadow-2xs` 133 · `shadow-2xl` 22 · `shadow-xs` 23 · `shadow-sm/md/lg/xl` 37 · `shadow-inner` 1 | 7 mức khác nhau |

### Khoảng cách
Phần lớn theo lưới Tailwind, nhưng dùng nhiều bước lẻ: `*-1.5` (389), `*-2.5` (276), `*-3.5` (70), `*-0.5` (88), `*-5` (93), `*-7` (6), cùng `p-[14px]`, `space-y-[2px]`.

### Icon & emoji
- Icon: chỉ lucide-react (tốt), nhưng cỡ 3 / 3.5 / 4 / 5 trộn lẫn, nét mặc định 2.
- Emoji/ký tự trang trí trên giao diện: 🔒 (7), ✅ (6), ⚠ (4), ❌ (2), ➔ (13), ✕ (1).

### Khung ứng dụng & microcopy
- Header + sidebar dày chữ, nhiều màu; chưa có chọn cảng, khoảng thời gian, tìm kiếm/command palette, thông báo, menu người dùng, thanh trạng thái hệ thống.
- Tiêu đề viết hoa mọi chữ đầu ("Dự Báo Phụ Tải Điện 24 Giờ"), trộn Anh–Việt trong một số nhãn.
- Tiêu đề tab trình duyệt cố định cho mọi trang; chưa có màn hình đăng nhập.

## 2. Giá trị hard-code thay vì biến (tóm tắt)
1. Màu thương hiệu `#004B91` / `#00386E` viết trực tiếp ≈ 350 lần.
2. Cỡ chữ `text-[Npx]` ≈ 760 lần.
3. Màu biểu đồ khai báo rời trong từng component.
4. Cỡ chữ trục, nét đường, màu lưới của Recharts khai báo trong từng biểu đồ.
5. Bo góc/đổ bóng chọn tùy ý theo từng card.

---

## 3. Sau khi chuẩn hóa

_(cập nhật ở cuối đợt chuẩn hóa – xem phần dưới)_
