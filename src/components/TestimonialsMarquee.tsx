import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, Dimensions } from 'react-native';
import { useThemeStore, getTheme } from '../store/themeStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = 280;
const CARD_MARGIN = 12;
const CARD_TOTAL_WIDTH = CARD_WIDTH + CARD_MARGIN;

interface TestimonialAuthor { name: string; handle: string; avatar: string; }
interface Testimonial { author: TestimonialAuthor; text: string; }
interface TestimonialsMarqueeProps { title?: string; description?: string; testimonials?: Testimonial[]; }

const testimonialData: Testimonial[] = [
  { author: { name: "Emma Thompson", handle: "@emmamusic", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face" }, text: "Learning guitar here has been amazing! The teachers are patient and the lessons are well-structured." },
  { author: { name: "David Park", handle: "@davidkeys", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face" }, text: "The piano courses transformed my playing. I went from beginner to performing in just 6 months!" },
  { author: { name: "Sofia Rodriguez", handle: "@sofiadrums", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face" }, text: "Best music learning app I've used. The building-based approach makes it so convenient." },
  { author: { name: "James Wilson", handle: "@jamesvocals", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face" }, text: "The vocal training here is top-notch. My range has improved dramatically!" },
  { author: { name: "Priya Sharma", handle: "@priyamelody", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face" }, text: "Love how I can learn music right in my building. No commute, just pure learning!" },
];

export const TestimonialsMarquee: React.FC<TestimonialsMarqueeProps> = ({
  title = "What Students Say",
  description = "Join thousands of music lovers learning with us",
  testimonials = testimonialData,
}) => {
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const scrollX = useRef(new Animated.Value(0)).current;
  const duplicatedTestimonials = [...testimonials, ...testimonials, ...testimonials];
  const totalWidth = testimonials.length * CARD_TOTAL_WIDTH;

  useEffect(() => {
    const animate = () => {
      scrollX.setValue(0);
      Animated.timing(scrollX, { toValue: -totalWidth, duration: testimonials.length * 5000, useNativeDriver: true }).start(() => animate());
    };
    animate();
    return () => scrollX.stopAnimation();
  }, [testimonials.length, totalWidth]);

  const styles = createStyles(theme, isDark);

  const TestimonialCard = ({ testimonial }: { testimonial: Testimonial }) => (
    <View style={styles.card}>
      <View style={styles.authorRow}>
        <Image source={{ uri: testimonial.author.avatar }} style={styles.avatar} />
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{testimonial.author.name}</Text>
          <Text style={styles.authorHandle}>{testimonial.author.handle}</Text>
        </View>
      </View>
      <Text style={styles.testimonialText}>{testimonial.text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <View style={styles.marqueeContainer}>
        <Animated.View style={[styles.marqueeContent, { transform: [{ translateX: scrollX }] }]}>
          {duplicatedTestimonials.map((testimonial, index) => (
            <TestimonialCard key={index} testimonial={testimonial} />
          ))}
        </Animated.View>
        <View style={styles.gradientLeft} />
        <View style={styles.gradientRight} />
      </View>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof getTheme>, isDark: boolean) => StyleSheet.create({
  container: { paddingVertical: 24 },
  header: { alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '700', color: theme.text, textAlign: 'center', marginBottom: 8 },
  description: { fontSize: 14, color: theme.textSecondary, textAlign: 'center' },
  marqueeContainer: { overflow: 'hidden', position: 'relative' },
  marqueeContent: { flexDirection: 'row', paddingVertical: 8 },
  card: { width: CARD_WIDTH, marginRight: CARD_MARGIN, backgroundColor: theme.card, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, borderTopWidth: 3, borderTopColor: theme.primary },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  authorInfo: { flex: 1 },
  authorName: { fontSize: 15, fontWeight: '600', color: theme.text },
  authorHandle: { fontSize: 13, color: theme.textSecondary, marginTop: 2 },
  testimonialText: { fontSize: 14, color: theme.textSecondary, lineHeight: 20 },
  gradientLeft: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 40, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(249, 250, 251, 0.9)' },
  gradientRight: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 40, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(249, 250, 251, 0.9)' },
});

export default TestimonialsMarquee;
