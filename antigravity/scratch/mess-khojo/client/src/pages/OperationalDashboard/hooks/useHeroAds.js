import { useMemo, useState } from 'react';
import { collection, query, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../firebase';
import { useFirestoreCollection } from '../../../hooks/useFirestoreCollection';

export function useHeroAds() {
    const { data: carouselConfig } = useFirestoreCollection(
        useMemo(() => doc(db, 'app_config', 'hero'), [])
    );
    const carouselEnabled = !!carouselConfig?.carouselEnabled;

    const { data: desktopAds } = useFirestoreCollection(
        useMemo(() => query(collection(db, 'hero_ads_desktop')), []),
        { sortBy: (a, b) => (a.order || 0) - (b.order || 0) }
    );

    const { data: mobileAds } = useFirestoreCollection(
        useMemo(() => query(collection(db, 'hero_ads_mobile')), []),
        { sortBy: (a, b) => (a.order || 0) - (b.order || 0) }
    );

    const [heroAdUploading, setHeroAdUploading] = useState(false);
    const [heroAdForm, setHeroAdForm] = useState({ linkUrl: '', title: '', district: 'all' });
    const [desktopAdFile, setDesktopAdFile] = useState(null);
    const [mobileAdFile, setMobileAdFile] = useState(null);

    const handleToggleCarousel = async () => {
        try {
            await setDoc(doc(db, 'app_config', 'hero'), { carouselEnabled: !carouselEnabled }, { merge: true });
        } catch (error) {
            console.error('Toggle failed:', error);
            alert('Failed to toggle carousel');
        }
    };

    const handleHeroAdUpload = async (section, compressImage) => {
        const currentFile = section === 'desktop' ? desktopAdFile : mobileAdFile;
        const currentAds = section === 'desktop' ? desktopAds : mobileAds;
        if (!currentFile) return;
        if (currentAds.length >= 10) return alert('Max 10 banners allowed per section');

        setHeroAdUploading(true);
        try {
            const compressed = await compressImage(currentFile);
            const ext = currentFile.name.split('.').pop() || 'jpg';
            const filename = `hero_${section}_${Date.now()}.${ext}`;
            const storageRef = ref(storage, `hero_ads/${section}/${filename}`);

            const snapshot = await uploadBytes(storageRef, compressed);
            const url = await getDownloadURL(snapshot.ref);

            const adDocRef = doc(collection(db, `hero_ads_${section}`));
            await setDoc(adDocRef, {
                imageUrl: url,
                linkUrl: heroAdForm.linkUrl || '',
                title: heroAdForm.title || '',
                district: heroAdForm.district || 'all',
                active: true,
                order: currentAds.length,
                createdAt: new Date(),
            });

            if (section === 'desktop') setDesktopAdFile(null);
            else setMobileAdFile(null);

            setHeroAdForm({ linkUrl: '', title: '', district: 'all' });
            document.getElementById(`hero-ad-file-${section}`).value = '';
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload banner');
        } finally {
            setHeroAdUploading(false);
        }
    };

    const handleReorderHeroAd = async (adId, direction, section) => {
        const currentAds = section === 'desktop' ? desktopAds : mobileAds;
        const index = currentAds.findIndex(a => a.id === adId);
        if (index === -1) return;

        const collectionName = `hero_ads_${section}`;
        if (direction === 'up' && index > 0) {
            const temp = currentAds[index].order;
            await updateDoc(doc(db, collectionName, currentAds[index].id), { order: currentAds[index - 1].order });
            await updateDoc(doc(db, collectionName, currentAds[index - 1].id), { order: temp });
        } else if (direction === 'down' && index < currentAds.length - 1) {
            const temp = currentAds[index].order;
            await updateDoc(doc(db, collectionName, currentAds[index].id), { order: currentAds[index + 1].order });
            await updateDoc(doc(db, collectionName, currentAds[index + 1].id), { order: temp });
        }
    };

    const handleToggleHeroAd = async (adId, currentState, section) => {
        try {
            await updateDoc(doc(db, `hero_ads_${section}`, adId), { active: !currentState });
        } catch (error) {
            console.error('Toggle visibility failed:', error);
            alert('Failed to update visibility');
        }
    };

    const handleDeleteHeroAd = async (adId, section) => {
        if (!window.confirm('Delete this banner ad?')) return;
        try {
            await deleteDoc(doc(db, `hero_ads_${section}`, adId));
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete banner');
        }
    };

    return {
        carouselEnabled,
        desktopAds,
        mobileAds,
        heroAdUploading,
        heroAdForm,
        setHeroAdForm,
        desktopAdFile,
        setDesktopAdFile,
        mobileAdFile,
        setMobileAdFile,
        handleToggleCarousel,
        handleHeroAdUpload,
        handleReorderHeroAd,
        handleToggleHeroAd,
        handleDeleteHeroAd
    };
}
