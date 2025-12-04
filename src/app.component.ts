import { Component, signal, ViewChild, ElementRef, inject, SecurityContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl, SafeHtml } from '@angular/platform-browser';
import { GeminiService } from './services/gemini.service';
import { MockDataService, TranscriptSegment } from './services/mock-data.service';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
})
export class AppComponent {
  // Services
  private geminiService = inject(GeminiService);
  private mockDataService = inject(MockDataService);
  private sanitizer = inject(DomSanitizer);

  // State Signals
  view = signal<'home' | 'processing' | 'dashboard'>('home');
  inputType = signal<'url' | 'file'>('url');
  statusMessage = signal<string>('');
  
  // Video Data
  videoSourceType = signal<'iframe' | 'file' | 'audio'>('iframe');
  videoUrl = signal<string>('');
  safeVideoUrl = signal<SafeResourceUrl>('');
  transcriptSegments = signal<TranscriptSegment[]>([]);
  isDemoMode = signal<boolean>(false);
  currentBvid = signal<string>('');

  // Chat State
  messages = signal<ChatMessage[]>([]);
  isTyping = signal<boolean>(false);

  // References
  @ViewChild('chatContainer') chatContainer!: ElementRef;
  @ViewChild('videoPlayer') videoPlayer?: ElementRef<HTMLVideoElement | HTMLAudioElement>;

  constructor() {
    // Expose seek function globally for timestamp clicks in innerHTML
    (window as any).appSeekVideo = (seconds: number) => {
      this.seekVideo(seconds);
    };
  }

  setInputType(type: 'url' | 'file') {
    this.inputType.set(type);
  }

  // Handle Bilibili URL Logic
  async processUrl(url: string) {
    if (!url && this.inputType() === 'url') return;
    
    // Extract BVID from URL using a more robust regex
    // Matches BV followed by alphanumeric characters, stopping at non-alphanumeric (like / or ?)
    const bvidMatch = url.match(/(BV[a-zA-Z0-9]{10,})/); 
    const bvid = bvidMatch ? bvidMatch[0] : null;

    if (!bvid) {
      alert('Invalid Bilibili URL. Please include a valid BV ID (e.g., BV1FV411d7u7).');
      return;
    }
    
    console.log('Extracted BVID:', bvid);
    
    this.view.set('processing');
    this.currentBvid.set(bvid);
    
    // Simulate steps
    this.statusMessage.set('Connecting to Bilibili...');
    await this.delay(800);
    
    this.statusMessage.set('Extracting video metadata...');
    await this.delay(1000);

    this.statusMessage.set('Downloading audio track...');
    await this.delay(1200);

    this.statusMessage.set('Transcribing with Gemini 2.5...');
    await this.delay(1500);

    // Get Transcript based on BVID
    const mockText = this.mockDataService.getTranscript(bvid);
    this.transcriptSegments.set(this.mockDataService.parseTranscript(mockText));
    
    this.videoSourceType.set('iframe');
    this.isDemoMode.set(true);
    
    // Bilibili Player Parameters:
    // high_quality=1: High quality
    // danmaku=0: Turn off comments
    // autoplay=0: Don't auto play
    this.videoUrl.set(`https://player.bilibili.com/player.html?bvid=${bvid}&page=1&high_quality=1&danmaku=0&autoplay=0`);
    this.safeVideoUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.videoUrl()));

    // Initialize Gemini Chat
    this.geminiService.startChat(mockText);

    this.view.set('dashboard');
  }

  // Handle File Upload Logic
  async handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Limit file size to 50MB for this browser demo to prevent crashes
      if (file.size > 50 * 1024 * 1024) {
        alert('File is too large for this demo. Please upload a file smaller than 50MB (try converting to Audio/MP3).');
        return;
      }

      this.view.set('processing');
      this.statusMessage.set('Reading file data...');
      
      try {
        // Convert File to Base64
        const base64Data = await this.fileToBase64(file);
        // Remove data URL prefix (e.g., "data:audio/mp3;base64,")
        const rawBase64 = base64Data.split(',')[1];
        
        this.statusMessage.set('Uploading to Gemini for Analysis...');
        
        // Call Gemini Service
        const transcriptText = await this.geminiService.generateTranscriptFromMedia(rawBase64, file.type);
        
        this.statusMessage.set('Processing transcript...');
        
        this.transcriptSegments.set(this.mockDataService.parseTranscript(transcriptText));
        this.geminiService.startChat(transcriptText);

        // Setup Player
        const objectUrl = URL.createObjectURL(file);
        
        if (file.type.startsWith('audio/')) {
           this.videoSourceType.set('audio');
        } else {
           this.videoSourceType.set('file');
        }
        
        this.videoUrl.set(objectUrl);
        this.safeVideoUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl));
        
        // This is REAL analysis, not demo mode
        this.isDemoMode.set(false);
        this.view.set('dashboard');

      } catch (err) {
        console.error(err);
        this.view.set('home');
        alert('Failed to analyze file. Please try again or check your API Key.');
      }
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  async handleUserMessage(text: string) {
    if (!text.trim()) return;

    // Add User Message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text
    };
    this.messages.update(msgs => [...msgs, userMsg]);
    this.scrollToBottom();

    this.isTyping.set(true);

    // Call Gemini
    const response = await this.geminiService.sendMessage(text);

    // Add AI Message
    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      text: response
    };
    this.messages.update(msgs => [...msgs, aiMsg]);
    this.isTyping.set(false);
    this.scrollToBottom();
  }

  // Utility to scroll chat
  scrollToBottom() {
    setTimeout(() => {
      if (this.chatContainer) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  autoResize(textarea: any) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  resetApp() {
    this.view.set('home');
    this.messages.set([]);
    this.transcriptSegments.set([]);
    this.isDemoMode.set(false);
    this.currentBvid.set('');
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Video Seeking Logic
  seekVideo(seconds: number) {
    if (this.videoSourceType() === 'file' || this.videoSourceType() === 'audio') {
       if (this.videoPlayer?.nativeElement) {
         this.videoPlayer.nativeElement.currentTime = seconds;
         this.videoPlayer.nativeElement.play();
       }
    } else {
      // For Bilibili Iframe, we can't seek via API without permissions/auth.
      // We perform a reload with 't' parameter as a fallback.
      const currentSrc = this.videoUrl();
      // Remove existing time param if any
      const baseUrl = currentSrc.replace(/&t=\d+/, '');
      const newUrl = `${baseUrl}&t=${seconds}`;
      this.safeVideoUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(newUrl));
    }
  }

  // Format AI response to make timestamps clickable
  formatAiResponse(text: string): SafeHtml {
    const regex = /\[(\d{1,2}:)?(\d{2}:\d{2})\]/g;
    const formatted = text.replace(regex, (match) => {
      const timeStr = match.replace('[', '').replace(']', '');
      const seconds = this.timeToSeconds(timeStr);
      return `<span class="timestamp-link" onclick="window.appSeekVideo(${seconds})">${match}</span>`;
    });

    return this.sanitizer.bypassSecurityTrustHtml(formatted);
  }

  private timeToSeconds(timeStr: string): number {
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else {
      return parts[0] * 60 + parts[1];
    }
  }
}