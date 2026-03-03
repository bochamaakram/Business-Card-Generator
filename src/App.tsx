import React, { useState, useRef } from 'react';
import { Download, Briefcase, Mail, Phone, MapPin, Globe, Maximize2, Minimize2, RotateCcw, Palette, Type, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { QRCodeSVG } from 'qrcode.react';

interface CardData {
    name: string;
    title: string;
    company: string;
    email: string;
    phone: string;
    website: string;
    address: string;
}

interface ThemeConfig {
    primaryColor: string;
    secondaryColor: string;
    bgColor: string;
    textColor: string;
    accentColor: string;
    fontFamily: string;
    bgImage: string | null;
}

type TemplateType = 'modern' | 'minimal' | 'corporate';
type OrientationType = 'horizontal' | 'vertical';

const App: React.FC = () => {
    const [data, setData] = useState<CardData>({
        name: 'Akram Doe',
        title: 'Senior Product Designer',
        company: 'TechFlow Systems',
        email: 'akram@techflow.com',
        phone: '+1 (555) 123-4567',
        website: 'https://www.techflow.com',
        address: 'Paris, France',
    });

    const [theme, setTheme] = useState<ThemeConfig>({
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
        bgColor: '#ffffff',
        textColor: '#0f172a',
        accentColor: '#3b82f6',
        fontFamily: 'Inter',
        bgImage: null,
    });

    const [template, setTemplate] = useState<TemplateType>('modern');
    const [orientation, setOrientation] = useState<OrientationType>('horizontal');
    const [showBack, setShowBack] = useState(false);
    const cardRefFront = useRef<HTMLDivElement>(null);
    const cardRefBack = useRef<HTMLDivElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setData((prev) => ({ ...prev, [name]: value }));
    };

    const handleThemeChange = (name: keyof ThemeConfig, value: string | null) => {
        setTheme((prev) => ({ ...prev, [name]: value }));
    };

    const downloadPDF = async () => {
        const isVerticalCard = orientation === 'vertical';
        const cardWidth = 85;
        const cardHeight = 55;
        const actualWidth = isVerticalCard ? cardHeight : cardWidth;
        const actualHeight = isVerticalCard ? cardWidth : cardHeight;

        // Use Landscape A4 for Vertical cards to fit 10 (5x2 grid)
        const useLandscape = isVerticalCard;
        const finalPdf = new jsPDF({
            orientation: useLandscape ? 'landscape' : 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const pW = useLandscape ? 297 : 210;
        const pH = useLandscape ? 210 : 297;
        const cols = useLandscape ? 5 : 2;
        const rows = useLandscape ? 2 : 5;

        const marginLeft = (pW - (cols * actualWidth)) / 2;
        const marginTop = (pH - (rows * actualHeight)) / 2;

        const captureFace = async (side: 'front' | 'back') => {
            const element = side === 'front' ? cardRefFront.current : cardRefBack.current;
            if (!element) return null;

            const canvas = await html2canvas(element, {
                scale: 4,
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
            });
            return canvas.toDataURL('image/png');
        };

        const drawPage = (imgData: string) => {
            // Draw cards
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const x = marginLeft + c * actualWidth;
                    const y = marginTop + r * actualHeight;
                    finalPdf.addImage(imgData, 'PNG', x, y, actualWidth, actualHeight);
                }
            }

            // Draw Crop Marks (dashed lines)
            finalPdf.setDrawColor(200, 200, 200);
            finalPdf.setLineDashPattern([2, 2], 0);

            // Vertical lines
            for (let c = 0; c <= cols; c++) {
                const x = marginLeft + c * actualWidth;
                finalPdf.line(x, 0, x, pH);
            }

            // Horizontal lines
            for (let r = 0; r <= rows; r++) {
                const y = marginTop + r * actualHeight;
                finalPdf.line(0, y, pW, y);
            }
        };

        try {
            const frontData = await captureFace('front');
            if (frontData) drawPage(frontData);

            const backData = await captureFace('back');
            if (backData) {
                finalPdf.addPage();
                drawPage(backData);
            }

            finalPdf.save(`${data.name.replace(/\s+/g, '_')}_A4_Print.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
        }
    };

    const getCardStyle = (side: 'front' | 'back') => {
        const baseStyle: React.CSSProperties = {
            fontFamily: theme.fontFamily,
            backgroundColor: theme.bgColor,
            color: theme.textColor,
            transition: 'all 0.3s ease',
        };

        if (template === 'modern') {
            if (side === 'front') {
                baseStyle.background = `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.accentColor} 100%)`;
                baseStyle.color = 'white';
            } else {
                baseStyle.backgroundColor = '#f8fafc';
                baseStyle.color = '#0f172a';
            }
        } else if (template === 'corporate') {
            if (side === 'front') {
                baseStyle.backgroundColor = theme.primaryColor;
                baseStyle.color = 'white';
            } else {
                baseStyle.backgroundColor = 'white';
                baseStyle.color = '#0f172a';
            }
        }

        return baseStyle;
    };

    const renderFrontFace = (hidden = false) => {
        const isVertical = orientation === 'vertical';
        const style = getCardStyle('front');
        if (hidden) {
            style.position = 'absolute';
            style.left = '-9999px';
        }

        return (
            <div ref={hidden ? cardRefFront : null} className={`business-card ${orientation}`} style={style}>
                {theme.bgImage && <img src={theme.bgImage} className="bg-image" crossOrigin="anonymous" />}
                <div className="content-layer" style={{ padding: '2.5rem', height: '100%', position: 'relative' }}>
                    {template === 'modern' ? (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', textAlign: 'left' }}>
                            <div style={{ width: '60px', height: '4px', background: 'white', marginBottom: '2rem', opacity: 0.5 }} />
                            <h1 style={{ fontSize: isVertical ? '2.5rem' : '3rem', fontWeight: 900, lineHeight: 1.1 }}>{data.company}</h1>
                            <p style={{ marginTop: '1.5rem', opacity: 0.9, letterSpacing: '0.1em', fontWeight: 500 }}>{data.website.replace(/^https?:\/\//, '')}</p>
                        </div>
                    ) : template === 'minimal' ? (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                            <h1 style={{ fontSize: isVertical ? '4rem' : '6rem', fontWeight: 900, letterSpacing: '-0.05em', marginBottom: '-1rem' }}>{data.name.split(' ')[0][0]}{data.name.split(' ')[1]?.[0] || ''}</h1>
                            <div style={{ borderTop: `1px solid ${theme.textColor}`, width: '50%', margin: '2rem 0' }} />
                            <p style={{ letterSpacing: '0.5em', textTransform: 'uppercase', fontSize: '0.75rem', opacity: 0.6 }}>{data.company}</p>
                        </div>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                            <div style={{ padding: '2rem', border: '8px solid rgba(255,255,255,0.2)', marginBottom: '1.5rem' }}>
                                <Briefcase size={48} />
                            </div>
                            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '0.05em' }}>{data.company.toUpperCase()}</h2>
                            <div style={{ position: 'absolute', bottom: '2rem', left: '2.5rem', right: '2.5rem', height: '1px', background: 'rgba(255,255,255,0.3)' }} />
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderBackFace = (hidden = false) => {
        const isVertical = orientation === 'vertical';
        const style = getCardStyle('back');
        if (hidden) {
            style.position = 'absolute';
            style.left = '-9999px';
        }
        const qrSize = isVertical ? 150 : 130;

        const renderContent = () => {
            switch (template) {
                case 'modern':
                    return (
                        <div className="content-layer" style={{ padding: '0', height: '100%', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '40%', height: '100%', background: `${theme.primaryColor}10`, borderRight: `1px solid ${theme.primaryColor}20` }} />
                            <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: isVertical ? 'column' : 'row', padding: '2.5rem', gap: '2rem' }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <h2 style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1, color: theme.textColor }}>{data.name.split(' ')[0]}<br /><span style={{ color: theme.primaryColor }}>{data.name.split(' ').slice(1).join(' ')}</span></h2>
                                    <p style={{ marginTop: '0.5rem', fontWeight: 600, letterSpacing: '0.1em', opacity: 0.8, textTransform: 'uppercase', fontSize: '0.75rem' }}>{data.title}</p>
                                    <div style={{ height: '2px', width: '30px', background: theme.primaryColor, margin: '1.5rem 0' }} />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.85rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Phone size={14} style={{ color: theme.primaryColor }} /> {data.phone}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Mail size={14} style={{ color: theme.primaryColor }} /> {data.email}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><MapPin size={14} style={{ color: theme.primaryColor }} /> {data.address}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {data.website && (
                                        <div style={{ background: 'white', padding: '12px', borderRadius: '20px', boxShadow: `0 20px 40px -10px ${theme.primaryColor}30`, border: `1px solid ${theme.primaryColor}20` }}>
                                            <QRCodeSVG value={data.website} size={qrSize + 20} fgColor={theme.primaryColor} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                case 'minimal':
                    return (
                        <div className="content-layer" style={{ padding: '2rem', justifyContent: 'center', alignItems: 'center' }}>
                            <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', right: '1.5rem', bottom: '1.5rem', border: '1px solid #f5f5f5', pointerEvents: 'none' }} />
                            <div style={{ textAlign: 'center', zIndex: 1 }}>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 300, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>{data.name}</h2>
                                <p style={{ opacity: 0.4, fontSize: '0.55rem', letterSpacing: '0.4em', marginBottom: '1.5rem' }}>{data.title.toUpperCase()}</p>

                                {data.website && (
                                    <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                                        <div style={{ padding: '6px', background: '#fff', border: '0.5px solid #000' }}>
                                            <QRCodeSVG value={data.website} size={80} fgColor="#000" />
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', fontSize: '0.6rem', letterSpacing: '0.1em', opacity: 0.5 }}>
                                    <span>{data.email}</span>
                                    <span style={{ opacity: 0.3 }}>|</span>
                                    <span>{data.phone}</span>
                                </div>
                            </div>
                        </div>
                    );
                case 'corporate':
                    return (
                        <div className="corporate-back" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: '1.25rem 1.75rem 0.75rem 1.75rem', borderBottom: '1px solid #f1f5f9' }}>
                                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>{data.name}</h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.1rem' }}>
                                    <span style={{ color: theme.primaryColor, fontWeight: 700, fontSize: '0.8rem' }}>{data.title}</span>
                                    <div style={{ width: '2px', height: '2px', borderRadius: '50%', background: '#cbd5e1' }} />
                                    <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{data.company}</span>
                                </div>
                            </div>

                            <div style={{ flex: 1, padding: '1.25rem 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: isVertical ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div className="icon-box" style={{ background: '#f8fafc', width: '20px', height: '20px', borderRadius: '4px' }}><Phone size={10} /></div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{data.phone}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div className="icon-box" style={{ background: '#f8fafc', width: '20px', height: '20px', borderRadius: '4px' }}><Mail size={10} /></div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{data.email}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div className="icon-box" style={{ background: '#f8fafc', width: '20px', height: '20px', borderRadius: '4px' }}><MapPin size={10} /></div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{data.address}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div className="icon-box" style={{ background: '#f8fafc', width: '20px', height: '20px', borderRadius: '4px' }}><Globe size={10} /></div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{data.website.replace(/^https?:\/\//, '')}</span>
                                    </div>
                                </div>

                                {data.website && (
                                    <div style={{ background: 'white', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                        <QRCodeSVG value={data.website} size={80} fgColor="#000" />
                                    </div>
                                )}
                            </div>
                            <div style={{ height: '4px', background: theme.primaryColor, width: '100%' }} />
                        </div>
                    );
            }
        };

        return (
            <div ref={hidden ? cardRefBack : null} className={`business-card ${orientation}`} style={style}>
                {renderContent()}
            </div>
        );
    };

    return (
        <div className="app-container">
            {/* Hidden elements for capturing both sides reliably */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                {renderFrontFace(true)}
                {renderBackFace(true)}
            </div>

            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                <h1 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Editor Center</h1>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input name="name" value={data.name} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Job Title</label>
                        <input name="title" value={data.title} onChange={handleInputChange} />
                    </div>
                </div>

                <div className="form-group">
                    <label>Company</label>
                    <input name="company" value={data.company} onChange={handleInputChange} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label>Email</label>
                        <input name="email" value={data.email} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Phone</label>
                        <input name="phone" value={data.phone} onChange={handleInputChange} />
                    </div>
                </div>

                <div className="form-group">
                    <label>Website URL (for QR)</label>
                    <input name="website" value={data.website} onChange={handleInputChange} />
                </div>

                <hr style={{ margin: '1.5rem 0', opacity: 0.1 }} />

                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Palette size={18} /> Appearance</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label>Primary</label>
                        <input type="color" value={theme.primaryColor} onChange={(e) => handleThemeChange('primaryColor', e.target.value)} style={{ height: '40px', padding: '0.2rem' }} />
                    </div>
                    <div className="form-group">
                        <label>Background</label>
                        <input type="color" value={theme.bgColor} onChange={(e) => handleThemeChange('bgColor', e.target.value)} style={{ height: '40px', padding: '0.2rem' }} />
                    </div>
                    <div className="form-group">
                        <label>Text</label>
                        <input type="color" value={theme.textColor} onChange={(e) => handleThemeChange('textColor', e.target.value)} style={{ height: '40px', padding: '0.2rem' }} />
                    </div>
                </div>

                <div className="form-group">
                    <label><Type size={14} /> Typography</label>
                    <select value={theme.fontFamily} onChange={(e) => handleThemeChange('fontFamily', e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(15,23,42,0.5)', color: 'white', borderRadius: '0.75rem', border: '1px solid var(--glass-border)' }}>
                        <option value="Inter">Inter (Sans)</option>
                        <option value="Outfit">Outfit (Modern)</option>
                        <option value="Playfair Display">Playfair (Serif)</option>
                        <option value="Montserrat">Montserrat (Classic)</option>
                    </select>
                </div>

                <div className="form-group">
                    <label><ImageIcon size={14} /> Background Image URL</label>
                    <input value={theme.bgImage || ''} onChange={(e) => handleThemeChange('bgImage', e.target.value || null)} placeholder="https://images.unsplash.com/..." />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                    <div>
                        <label>Template</label>
                        <select value={template} onChange={(e) => setTemplate(e.target.value as TemplateType)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(15,23,42,0.5)', color: 'white', borderRadius: '0.75rem', border: '1px solid var(--glass-border)' }}>
                            <option value="modern">Modern Glass</option>
                            <option value="minimal">Minimal Clean</option>
                            <option value="corporate">Professional Corporate</option>
                        </select>
                    </div>
                    <div>
                        <label>Orientation</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => setOrientation('horizontal')} className="btn-primary" style={{ flex: 1, padding: '0.5rem', opacity: orientation === 'horizontal' ? 1 : 0.3 }}><Maximize2 size={16} /></button>
                            <button onClick={() => setOrientation('vertical')} className="btn-primary" style={{ flex: 1, padding: '0.5rem', opacity: orientation === 'vertical' ? 1 : 0.3 }}><Minimize2 size={16} /></button>
                        </div>
                    </div>
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Live Preview ({template.toUpperCase()})</h2>

                <div style={{ width: orientation === 'horizontal' ? '500px' : '280px', height: orientation === 'horizontal' ? '280px' : '500px', position: 'relative', perspective: '1000px' }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`${template}-${orientation}-${showBack}`}
                            initial={{ rotateY: 90, opacity: 0 }}
                            animate={{ rotateY: 0, opacity: 1 }}
                            exit={{ rotateY: -90, opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            style={{ width: '100%', height: '100%' }}
                        >
                            {showBack ? renderBackFace() : renderFrontFace()}
                        </motion.div>
                    </AnimatePresence>

                    <button
                        onClick={() => setShowBack(!showBack)}
                        style={{ position: 'absolute', bottom: '-40px', left: '50%', transform: 'translateX(-50%)', background: 'transparent', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', border: 'none' }}
                    >
                        <RotateCcw size={16} /> Flip to {showBack ? 'Front' : 'Back'}
                    </button>
                </div>

                <button className="btn-download" onClick={downloadPDF} style={{ marginTop: '5rem' }}>
                    <Download size={20} /> Download 2-Page PDF
                </button>

                <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '400px' }}>
                    Both Front and Back will be included in the PDF export.
                </p>
            </motion.div>
        </div>
    );
};

export default App;
