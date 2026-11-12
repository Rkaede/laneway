import type { JSX } from 'solid-js';

import * as AboutStories from './about.stories';
import * as AlertStories from './alert.stories';
import * as ApiKeyFormStories from './api-key-form.stories';
import * as AppErrorStories from './app-error.stories';
import * as AudioButtonStories from './audio-button.stories';
import * as AvatarStories from './avatar.stories';
import * as BadgeStories from './badge.stories';
import * as BranchNoticeStories from './branch-notice.stories';
import * as ButtonStories from './button.stories';
import * as CardStories from './card.stories';
import * as ChatAlertsStories from './chat-alerts.stories';
import * as ChatInputStories from './chat-input.stories';
import * as ChatPanelStories from './chat-panel.stories';
import * as ChatSettingsStories from './chat-settings.stories';
import * as ChatbarStories from './chatbar.stories';
import * as CodeblockStories from './codeblock.stories';
import * as CollectionEmptyStateStories from './collection-empty-state.stories';
import * as CommandStories from './command.stories';
import * as CopyButtonStories from './copy-button.stories';
import * as DeleteButtonStories from './delete-button.stories';
import * as DialogStories from './dialog.stories';
import * as DropdownStories from './dropdown.stories';
import * as FormsStories from './forms.stories';
import * as HoverCardStories from './hover-card.stories';
import * as IconBadgeStories from './icon-badge.stories';
import * as IconStories from './icons.stories';
import * as InputStories from './input.stories';
import * as LightboxStories from './lightbox.stories';
import * as LoaderStories from './loader.stories';
import * as LocalImageStories from './local-image.stories';
import * as MarkdownStories from './markdown.stories';
import * as MessageStories from './message.stories';
import * as ModelCardStories from './model-card.stories';
import * as ModelIconStories from './model-icon.stories';
import * as MultiComboboxStories from './multi-combobox.stories';
import * as NotificationsStories from './notifications.stories';
import * as PopoverStories from './popover.stories';
import * as ScrollPanelStories from './scrollpanel.stories';
import * as SelectStories from './select.stories';
import * as SeparatorStories from './separator.stories';
import * as SettingsSectionStories from './settings-section.stories';
import * as ShortcutStories from './shortcut.stories';
import * as SidebarStories from './sidebar.stories';
import * as SidebarIconStories from './sidebar-icon.stories';
import * as SpeedDialStories from './speed-dial.stories';
import * as SpeedDialOptionStories from './speed-dial-option.stories';
import * as StarterPromptsStories from './starter-prompts.stories';
import * as StatsPopoverStories from './stats-popover.stories';
import * as StreamControlsStories from './stream-controls.stories';
import * as SwitchStories from './switch.stories';
import * as TagStories from './tag.stories';
import * as TemplateCollectionStories from './template-collection.stories';
import * as TextStories from './text.stories';
import * as TextEditorStories from './text-editor.stories';
import * as TextAreaStories from './textarea.stories';
import * as ThumbnailStories from './thumbnail.stories';
import * as TooltipStories from './tooltip.stories';
import * as UseAnimatedText from './use-animated-text.stories';

type StoryGroup = { title: string; stories: Record<string, () => JSX.Element> };

// Keyed by the URL segment under /sandbox.
export const storyMap: Record<string, StoryGroup> = {
  about: { title: 'About', stories: AboutStories },
  alert: { title: 'Alert', stories: AlertStories },
  'api-key-form': { title: 'ApiKeyForm', stories: ApiKeyFormStories },
  'app-error': { title: 'AppError', stories: AppErrorStories },
  'audio-button': { title: 'AudioButton', stories: AudioButtonStories },
  avatar: { title: 'Avatar', stories: AvatarStories },
  badge: { title: 'Badge', stories: BadgeStories },
  'branch-notice': { title: 'BranchNotice', stories: BranchNoticeStories },
  button: { title: 'Button', stories: ButtonStories },
  card: { title: 'Card', stories: CardStories },
  'chat-alerts': { title: 'Chat Alerts', stories: ChatAlertsStories },
  'chat-input': { title: 'ChatInput', stories: ChatInputStories },
  'chat-panel': { title: 'ChatPanel', stories: ChatPanelStories },
  'chat-settings': { title: 'ChatSettings', stories: ChatSettingsStories },
  chatbar: { title: 'Chatbar', stories: ChatbarStories },
  codeblock: { title: 'CodeBlock', stories: CodeblockStories },
  'collection-empty-state': {
    title: 'CollectionEmptyState',
    stories: CollectionEmptyStateStories,
  },
  command: { title: 'Command', stories: CommandStories },
  'copy-button': { title: 'CopyButton', stories: CopyButtonStories },
  'delete-button': { title: 'DeleteButton', stories: DeleteButtonStories },
  dialog: { title: 'Dialog', stories: DialogStories },
  dropdown: { title: 'DropdownMenu', stories: DropdownStories },
  forms: { title: 'Forms', stories: FormsStories },
  'hover-card': { title: 'HoverCard', stories: HoverCardStories },
  'icon-badge': { title: 'IconBadge', stories: IconBadgeStories },
  icons: { title: 'Icons', stories: IconStories },
  input: { title: 'Input', stories: InputStories },
  lightbox: { title: 'Lightbox', stories: LightboxStories },
  loader: { title: 'Loader', stories: LoaderStories },
  'local-image': { title: 'LocalImage', stories: LocalImageStories },
  markdown: { title: 'Markdown', stories: MarkdownStories },
  message: { title: 'Message', stories: MessageStories },
  'model-card': { title: 'ModelCard', stories: ModelCardStories },
  'model-icon': { title: 'ModelIcon', stories: ModelIconStories },
  'multi-combobox': { title: 'MultiCombobox', stories: MultiComboboxStories },
  notifications: { title: 'Notifications', stories: NotificationsStories },
  popover: { title: 'Popover', stories: PopoverStories },
  scrollpanel: { title: 'ScrollPanel', stories: ScrollPanelStories },
  select: { title: 'Select', stories: SelectStories },
  separator: { title: 'Separator', stories: SeparatorStories },
  'settings-section': { title: 'Settings Section', stories: SettingsSectionStories },
  shortcut: { title: 'Shortcut', stories: ShortcutStories },
  sidebar: { title: 'Sidebar', stories: SidebarStories },
  'sidebar-icon': { title: 'SidebarIcon', stories: SidebarIconStories },
  'speed-dial': { title: 'SpeedDial', stories: SpeedDialStories },
  'speed-dial-option': { title: 'SpeedDialOption', stories: SpeedDialOptionStories },
  'starter-prompts': { title: 'StarterPrompts', stories: StarterPromptsStories },
  'stats-popover': { title: 'StatsPopover', stories: StatsPopoverStories },
  'stream-controls': { title: 'StreamControls', stories: StreamControlsStories },
  switch: { title: 'Switch', stories: SwitchStories },
  tag: { title: 'Tag', stories: TagStories },
  'template-collection': { title: 'Template Collection', stories: TemplateCollectionStories },
  text: { title: 'Text', stories: TextStories },
  'text-editor': { title: 'TextEditor', stories: TextEditorStories },
  textarea: { title: 'TextArea', stories: TextAreaStories },
  thumbnail: { title: 'Thumbnail', stories: ThumbnailStories },
  tooltip: { title: 'Tooltip', stories: TooltipStories },
  'use-animated-text': { title: 'useAnimatedText', stories: UseAnimatedText },
};
