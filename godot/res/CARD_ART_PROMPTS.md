# Card Art Prompt Mapping

用途：把下面的 `Prompt` 直接粘到 ChatGPT 图片生成，生成后按 `Filename` 保存到 `godot/res/`。

统一建议参数：
- `size`: `1024x1024`
- `style`: 卡通奇幻、柔和配色、高可读性
- 统一负面词：`blurry, low detail, photorealistic, text, logo, watermark, cluttered background`

| Card ID | Card Name | Filename | Prompt |
|---|---|---|---|
| `c1` | Blazing Strike | `c1_blazing_strike.png` | `cartoon fantasy spell card art, blazing fire slash impact, dynamic arc of flame, bright orange-red core, soft shading, centered composition, clean silhouette, no text, no logo, no watermark` |
| `c2` | Vine Snare | `c2_vine_snare.png` | `cartoon fantasy control spell card art, twisting magical vines forming a slowing trap, green glow, soft painterly style, centered composition, clean silhouette, no text, no logo, no watermark` |
| `c10` | Wood Resource | `c10_wood_resource.png` | `cartoon fantasy resource card art, glowing ancient seed and green crystal energy, floating particles, soft light, centered composition, clean silhouette, no text, no logo, no watermark` |
| `c11` | Fire Resource | `c11_fire_resource.png` | `cartoon fantasy resource card art, fiery mana crystal core, warm orange sparks, soft volumetric glow, centered composition, clean silhouette, no text, no logo, no watermark` |
| `c47` | Scout Shot | `c47_scout_shot.png` | `cartoon fantasy attack card art, compact metal projectile shot with speed trails, silver highlights, dynamic motion, centered composition, clean silhouette, no text, no logo, no watermark` |
| `c48` | Lane Disrupt | `c48_lane_disrupt.png` | `cartoon fantasy control spell card art, wooden sigils and ripple field disrupting a battle lane, green-brown magical wave, soft shading, centered composition, no text, no logo, no watermark` |
| `c50` | Frontline Scout | `c50_frontline_scout.png` | `cartoon fantasy unit portrait card art, small earth guardian scout with sturdy shield stance, friendly but tactical expression, earthy palette, centered composition, no text, no logo, no watermark` |

## Existing Manual Filenames (Optional Reuse)

如果你想沿用之前代码里按元素读取的旧文件名，也可以额外生成：
- `fireattact.png`（火元素通用图）
- `woodattact.png`（木元素通用图）

但推荐优先使用上表里按卡牌 ID 的文件名，后续更容易做精确绑定。
