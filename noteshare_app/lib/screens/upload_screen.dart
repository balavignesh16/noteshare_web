import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:file_picker/file_picker.dart';
import 'package:lottie/lottie.dart';
import 'dart:io';

class UploadScreen extends StatefulWidget {
  const UploadScreen({Key? key}) : super(key: key);

  @override
  _UploadScreenState createState() => _UploadScreenState();
}

class _UploadScreenState extends State<UploadScreen> {
  String? _selectedCourse;
  final _facultyController = TextEditingController();
  final _moduleController = TextEditingController();
  final _topicController = TextEditingController();
  PlatformFile? _pickedFile;
  bool _isLoading = false;
  bool _isSuccess = false;

  Future<void> _pickFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf'],
    );
    if (result != null) {
      setState(() => _pickedFile = result.files.first);
    }
  }

  Future<void> _uploadNote() async {
    if (_pickedFile == null || _selectedCourse == null || _topicController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Course, topic, and a PDF file are required.')),
      );
      return;
    }

    setState(() => _isLoading = true);
    
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) throw Exception('You must be logged in.');

      final file = File(_pickedFile!.path!);
      final ref = FirebaseStorage.instance.ref().child('notes/${DateTime.now().millisecondsSinceEpoch}-${_pickedFile!.name}');
      final uploadTask = await ref.putFile(file);
      final downloadUrl = await uploadTask.ref.getDownloadURL();

      await FirebaseFirestore.instance.collection('notes').add({
        'course': _selectedCourse,
        'faculty': _facultyController.text,
        'module': int.tryParse(_moduleController.text) ?? 0,
        'topic': _topicController.text,
        'fileUrl': downloadUrl,
        'userId': user.uid,
        'createdAt': FieldValue.serverTimestamp(),
      });
      
      final userRef = FirebaseFirestore.instance.collection('users').doc(user.uid);
      await userRef.update({'points': FieldValue.increment(10)});

      setState(() => _isSuccess = true);

      Future.delayed(const Duration(seconds: 3), () {
        if (mounted) {
          setState(() {
            _isSuccess = false;
            _pickedFile = null;
            _selectedCourse = null;
            _facultyController.clear();
            _moduleController.clear();
            _topicController.clear();
          });
        }
      });

    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Upload failed: ${e.toString()}')),
      );
    } finally {
       if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Upload Note')),
      body: _isSuccess 
      ? Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Lottie.asset('assets/success.json', width: 200, height: 200, repeat: false),
              const SizedBox(height: 16),
              const Text('Upload Successful!', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const Text('+10 Points awarded!', style: TextStyle(fontSize: 16, color: Colors.green)),
            ],
          ),
        )
      : SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            DropdownButtonFormField<String>(
              value: _selectedCourse,
              decoration: const InputDecoration(labelText: 'Select Course'),
              hint: const Text('Select Course'),
              onChanged: (String? newValue) => setState(() => _selectedCourse = newValue),
              items: const [ // In a real app, this would come from a dynamic source
                'BCSE301L - Software Engineering',
                'BCSE302L - Database Systems',
                'BMAT101L - Calculus',
                'BPHY101L - Engineering Physics',
                'BCSE102L - OOP',
                'BENG101L - Technical English'
              ].map<DropdownMenuItem<String>>((String value) {
                return DropdownMenuItem<String>(
                  value: value,
                  child: Text(value, overflow: TextOverflow.ellipsis),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
            TextField(controller: _topicController, decoration: const InputDecoration(labelText: 'Topic *')),
            const SizedBox(height: 16),
            TextField(controller: _facultyController, decoration: const InputDecoration(labelText: 'Faculty Name')),
            const SizedBox(height: 16),
            TextField(controller: _moduleController, decoration: const InputDecoration(labelText: 'Module Number'), keyboardType: TextInputType.number),
            const SizedBox(height: 24),
            OutlinedButton.icon(
              style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 12)),
              icon: const Icon(Icons.attach_file),
              label: Text(_pickedFile == null ? 'Select PDF File *' : _pickedFile!.name),
              onPressed: _pickFile,
            ),
            const SizedBox(height: 24),
            _isLoading 
            ? const Center(child: CircularProgressIndicator())
            : FilledButton.icon(
              icon: const Icon(Icons.cloud_upload_outlined),
              label: const Text('Upload Note'),
              onPressed: _uploadNote,
            )
          ],
        ),
      ),
    );
  }
}